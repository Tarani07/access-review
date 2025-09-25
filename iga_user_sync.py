#!/usr/bin/env python3
"""
IGA User Synchronization Script for SparrowVision
Enhanced API integration for Identity Governance and Administration platforms

This script retrieves all users from an IGA API (JumpCloud, Okta, etc.) 
and processes them for access governance and compliance reporting.

Author: SparrowVision Team
Version: 2.0
Compatible with: JumpCloud, Okta, Azure AD, Google Workspace
"""

import requests
import json
import time
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import os
from dataclasses import dataclass, asdict
from enum import Enum

# Configure logging for production use
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('iga_sync.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('IGA_UserSync')

class UserStatus(Enum):
    """User status enumeration for IGA platforms"""
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED" 
    PROVISIONED = "PROVISIONED"
    STAGED = "STAGED"
    DEPROVISIONED = "DEPROVISIONED"
    EXIT = "EXIT"

@dataclass
class IGAUser:
    """Data class representing a user from IGA platform"""
    id: str
    email: str
    username: str
    first_name: str
    last_name: str
    display_name: str
    status: str
    department: Optional[str] = None
    job_title: Optional[str] = None
    manager_id: Optional[str] = None
    manager_email: Optional[str] = None
    phone_number: Optional[str] = None
    employee_id: Optional[str] = None
    created_date: Optional[str] = None
    last_login: Optional[str] = None
    last_updated: Optional[str] = None
    groups: List[str] = None
    attributes: Dict[str, Any] = None
    risk_score: int = 0
    
    def __post_init__(self):
        if self.groups is None:
            self.groups = []
        if self.attributes is None:
            self.attributes = {}
        if not self.display_name:
            self.display_name = f"{self.first_name} {self.last_name}".strip()

class IGAConfig:
    """Configuration class for IGA API integration"""
    
    def __init__(self):
        # Core API Configuration
        self.BASE_URL = os.getenv('IGA_API_URL', 'https://console.jumpcloud.com/api')
        self.API_KEY = os.getenv('IGA_API_KEY', '')
        self.ORG_ID = os.getenv('IGA_ORG_ID', '')
        
        # Request Configuration
        self.TIMEOUT = int(os.getenv('IGA_TIMEOUT', '30'))
        self.MAX_RETRIES = int(os.getenv('IGA_MAX_RETRIES', '3'))
        self.RETRY_DELAY = int(os.getenv('IGA_RETRY_DELAY', '2'))
        self.PAGE_SIZE = int(os.getenv('IGA_PAGE_SIZE', '100'))
        
        # Rate Limiting
        self.RATE_LIMIT_DELAY = float(os.getenv('IGA_RATE_LIMIT_DELAY', '0.5'))
        
        # Validation
        if not self.API_KEY:
            raise ValueError("IGA_API_KEY environment variable is required")
        if not self.BASE_URL:
            raise ValueError("IGA_API_URL environment variable is required")

class IGAUserRetriever:
    """Main class for retrieving users from IGA platforms"""
    
    def __init__(self, config: IGAConfig = None):
        self.config = config or IGAConfig()
        self.session = self._create_session()
        self.users: List[IGAUser] = []
        self.total_users = 0
        self.sync_stats = {
            'start_time': None,
            'end_time': None,
            'total_users': 0,
            'active_users': 0,
            'suspended_users': 0,
            'api_calls': 0,
            'errors': 0,
            'rate_limited': 0
        }
        
    def _create_session(self) -> requests.Session:
        """Create and configure requests session with authentication"""
        session = requests.Session()
        
        # Set authentication header
        session.headers.update({
            'Authorization': f'Bearer {self.config.API_KEY}',
            'Content-Type': 'application/json',
            'User-Agent': 'SparrowVision-IGA-Sync/2.0',
            'Accept': 'application/json'
        })
        
        # Add organization ID header if available (for multi-tenant APIs)
        if self.config.ORG_ID:
            session.headers.update({
                'x-org-id': self.config.ORG_ID
            })
        
        logger.info(f"Session configured for IGA API: {self.config.BASE_URL}")
        return session
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """
        Make authenticated API request with error handling and retries
        
        Args:
            endpoint: API endpoint path
            params: Query parameters
            
        Returns:
            API response data
            
        Raises:
            requests.RequestException: On API request failure
        """
        url = f"{self.config.BASE_URL.rstrip('/')}/{endpoint.lstrip('/')}"
        params = params or {}
        
        for attempt in range(self.config.MAX_RETRIES):
            try:
                logger.debug(f"Making request to: {url} (attempt {attempt + 1})")
                self.sync_stats['api_calls'] += 1
                
                response = self.session.get(
                    url, 
                    params=params, 
                    timeout=self.config.TIMEOUT
                )
                
                # Handle rate limiting (429 status)
                if response.status_code == 429:
                    self.sync_stats['rate_limited'] += 1
                    retry_after = int(response.headers.get('Retry-After', self.config.RETRY_DELAY))
                    logger.warning(f"Rate limited. Waiting {retry_after} seconds...")
                    time.sleep(retry_after)
                    continue
                
                # Raise for HTTP errors
                response.raise_for_status()
                
                # Rate limiting delay between successful requests
                if self.config.RATE_LIMIT_DELAY > 0:
                    time.sleep(self.config.RATE_LIMIT_DELAY)
                
                return response.json()
                
            except requests.exceptions.Timeout:
                logger.error(f"Request timeout for {url} (attempt {attempt + 1})")
                if attempt == self.config.MAX_RETRIES - 1:
                    self.sync_stats['errors'] += 1
                    raise
                time.sleep(self.config.RETRY_DELAY * (attempt + 1))
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Request failed for {url}: {str(e)} (attempt {attempt + 1})")
                if attempt == self.config.MAX_RETRIES - 1:
                    self.sync_stats['errors'] += 1
                    raise
                time.sleep(self.config.RETRY_DELAY * (attempt + 1))
        
        raise requests.RequestException(f"Failed to complete request after {self.config.MAX_RETRIES} attempts")
    
    def _parse_user_data(self, user_data: Dict[str, Any]) -> IGAUser:
        """
        Parse raw API user data into IGAUser object
        
        Args:
            user_data: Raw user data from API
            
        Returns:
            Parsed IGAUser object
        """
        try:
            # Handle different API response formats
            user_id = user_data.get('_id') or user_data.get('id') or user_data.get('userId', '')
            email = user_data.get('email', '')
            username = user_data.get('username') or user_data.get('login') or email
            
            # Parse name fields
            first_name = user_data.get('firstname') or user_data.get('firstName') or user_data.get('given_name', '')
            last_name = user_data.get('lastname') or user_data.get('lastName') or user_data.get('family_name', '')
            display_name = user_data.get('displayname') or user_data.get('displayName') or f"{first_name} {last_name}".strip()
            
            # Parse status with normalization
            status_raw = user_data.get('activated', user_data.get('suspended', user_data.get('status', 'UNKNOWN')))
            if isinstance(status_raw, bool):
                status = UserStatus.ACTIVE.value if status_raw else UserStatus.SUSPENDED.value
            else:
                status = str(status_raw).upper()
            
            # Parse optional fields
            department = user_data.get('department') or user_data.get('organization', '')
            job_title = user_data.get('jobTitle') or user_data.get('title', '')
            employee_id = user_data.get('employeeIdentifier') or user_data.get('employeeNumber', '')
            phone = user_data.get('phoneNumber') or user_data.get('mobilePhone', '')
            
            # Parse dates
            created_date = user_data.get('created') or user_data.get('createdAt')
            last_login = user_data.get('lastLogin') or user_data.get('lastSignIn')
            last_updated = user_data.get('updated') or user_data.get('lastUpdated')
            
            # Parse groups/roles
            groups = []
            if 'groups' in user_data and isinstance(user_data['groups'], list):
                groups = [g.get('name', g) if isinstance(g, dict) else str(g) for g in user_data['groups']]
            
            # Calculate risk score based on user attributes
            risk_score = self._calculate_risk_score(user_data, status, last_login, groups)
            
            return IGAUser(
                id=user_id,
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
                display_name=display_name,
                status=status,
                department=department,
                job_title=job_title,
                employee_id=employee_id,
                phone_number=phone,
                created_date=created_date,
                last_login=last_login,
                last_updated=last_updated,
                groups=groups,
                attributes=user_data,
                risk_score=risk_score
            )
            
        except Exception as e:
            logger.error(f"Failed to parse user data: {str(e)}")
            logger.debug(f"Raw user data: {json.dumps(user_data, indent=2)}")
            raise
    
    def _calculate_risk_score(self, user_data: Dict, status: str, last_login: Optional[str], groups: List[str]) -> int:
        """
        Calculate risk score for user based on various factors
        
        Returns:
            Risk score (0-100)
        """
        risk_score = 0
        
        # Status-based risk
        if status == UserStatus.SUSPENDED.value:
            risk_score += 20
        elif status == UserStatus.DEPROVISIONED.value:
            risk_score += 50
        
        # Last login based risk
        if last_login:
            try:
                login_date = datetime.fromisoformat(last_login.replace('Z', '+00:00'))
                days_since_login = (datetime.now() - login_date.replace(tzinfo=None)).days
                
                if days_since_login > 90:
                    risk_score += 30
                elif days_since_login > 30:
                    risk_score += 15
                elif days_since_login > 7:
                    risk_score += 5
            except (ValueError, AttributeError):
                risk_score += 10  # Unknown login date is risky
        else:
            risk_score += 25  # No login date is risky
        
        # Group-based risk (admin groups)
        admin_keywords = ['admin', 'administrator', 'root', 'superuser', 'privileged']
        admin_groups = [g for g in groups if any(keyword in g.lower() for keyword in admin_keywords)]
        risk_score += len(admin_groups) * 10
        
        # Cap at 100
        return min(risk_score, 100)
    
    def retrieve_all_users(self) -> List[IGAUser]:
        """
        Retrieve all users using cursor-based pagination
        
        Returns:
            List of all users from the IGA platform
        """
        self.sync_stats['start_time'] = datetime.now()
        logger.info("Starting user retrieval from IGA platform...")
        
        next_cursor = None
        page_count = 0
        
        try:
            while True:
                page_count += 1
                logger.info(f"Fetching page {page_count}...")
                
                # Prepare pagination parameters
                params = {
                    'limit': self.config.PAGE_SIZE,
                    'fields': 'id,email,username,firstname,lastname,displayname,activated,suspended,department,jobTitle,employeeIdentifier,phoneNumber,created,lastLogin,groups'
                }
                
                if next_cursor:
                    params['cursor'] = next_cursor
                
                # Make API request
                response_data = self._make_request('systemusers', params)
                
                # Handle different response formats
                if 'results' in response_data:
                    users_data = response_data['results']
                    next_cursor = response_data.get('next_cursor')
                elif 'data' in response_data:
                    users_data = response_data['data']
                    next_cursor = response_data.get('next_cursor') or response_data.get('nextCursor')
                else:
                    users_data = response_data if isinstance(response_data, list) else []
                    next_cursor = None
                
                # Process users from this page
                page_user_count = 0
                for user_data in users_data:
                    try:
                        user = self._parse_user_data(user_data)
                        self.users.append(user)
                        page_user_count += 1
                        
                        # Update stats
                        if user.status == UserStatus.ACTIVE.value:
                            self.sync_stats['active_users'] += 1
                        elif user.status in [UserStatus.SUSPENDED.value, UserStatus.DEPROVISIONED.value]:
                            self.sync_stats['suspended_users'] += 1
                            
                    except Exception as e:
                        logger.error(f"Failed to process user: {str(e)}")
                        self.sync_stats['errors'] += 1
                        continue
                
                logger.info(f"Processed {page_user_count} users from page {page_count}")
                
                # Check if we have more pages
                if not next_cursor or not users_data:
                    break
                    
        except Exception as e:
            logger.error(f"Failed to retrieve users: {str(e)}")
            raise
        finally:
            self.sync_stats['end_time'] = datetime.now()
            self.sync_stats['total_users'] = len(self.users)
            self._log_sync_summary()
        
        return self.users
    
    def _log_sync_summary(self):
        """Log comprehensive sync summary"""
        duration = (self.sync_stats['end_time'] - self.sync_stats['start_time']).total_seconds()
        
        logger.info("=" * 60)
        logger.info("IGA USER SYNCHRONIZATION COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Total Users Retrieved: {self.sync_stats['total_users']}")
        logger.info(f"Active Users: {self.sync_stats['active_users']}")
        logger.info(f"Suspended Users: {self.sync_stats['suspended_users']}")
        logger.info(f"API Calls Made: {self.sync_stats['api_calls']}")
        logger.info(f"Rate Limited Requests: {self.sync_stats['rate_limited']}")
        logger.info(f"Errors Encountered: {self.sync_stats['errors']}")
        logger.info(f"Sync Duration: {duration:.2f} seconds")
        logger.info(f"Average Users/Second: {self.sync_stats['total_users'] / duration:.2f}")
        logger.info("=" * 60)
    
    def export_users_json(self, filename: str = None) -> str:
        """
        Export users to JSON file for SparrowVision import
        
        Args:
            filename: Output filename (default: auto-generated)
            
        Returns:
            Path to exported file
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"iga_users_export_{timestamp}.json"
        
        export_data = {
            'metadata': {
                'export_timestamp': datetime.now().isoformat(),
                'total_users': len(self.users),
                'sync_stats': self.sync_stats,
                'source_api': self.config.BASE_URL
            },
            'users': [asdict(user) for user in self.users]
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, default=str)
        
        logger.info(f"Users exported to: {filename}")
        return filename
    
    def get_high_risk_users(self, risk_threshold: int = 70) -> List[IGAUser]:
        """Get users with risk score above threshold"""
        return [user for user in self.users if user.risk_score >= risk_threshold]
    
    def get_inactive_users(self, days: int = 30) -> List[IGAUser]:
        """Get users who haven't logged in for specified days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        inactive_users = []
        
        for user in self.users:
            if not user.last_login:
                inactive_users.append(user)
                continue
                
            try:
                login_date = datetime.fromisoformat(user.last_login.replace('Z', '+00:00'))
                if login_date.replace(tzinfo=None) < cutoff_date:
                    inactive_users.append(user)
            except (ValueError, AttributeError):
                inactive_users.append(user)  # Include users with unparseable dates
        
        return inactive_users
    
    def get_privileged_users(self) -> List[IGAUser]:
        """Get users with administrative privileges"""
        admin_keywords = ['admin', 'administrator', 'root', 'superuser', 'privileged', 'sudo']
        privileged_users = []
        
        for user in self.users:
            for group in user.groups:
                if any(keyword in group.lower() for keyword in admin_keywords):
                    privileged_users.append(user)
                    break
        
        return privileged_users

def main():
    """Main execution function"""
    try:
        # Initialize configuration and retriever
        config = IGAConfig()
        retriever = IGAUserRetriever(config)
        
        # Retrieve all users
        users = retriever.retrieve_all_users()
        
        # Print summary
        print(f"\n🎉 Successfully retrieved {len(users)} users from IGA platform!")
        print(f"📊 Active users: {retriever.sync_stats['active_users']}")
        print(f"⚠️  Suspended users: {retriever.sync_stats['suspended_users']}")
        print(f"⚡ API calls made: {retriever.sync_stats['api_calls']}")
        
        # Export data for SparrowVision
        export_file = retriever.export_users_json()
        print(f"📁 Data exported to: {export_file}")
        
        # Security insights
        high_risk_users = retriever.get_high_risk_users()
        inactive_users = retriever.get_inactive_users(30)
        privileged_users = retriever.get_privileged_users()
        
        print(f"\n🔍 SECURITY INSIGHTS:")
        print(f"🚨 High risk users (score ≥70): {len(high_risk_users)}")
        print(f"😴 Inactive users (30+ days): {len(inactive_users)}")
        print(f"🔐 Privileged users: {len(privileged_users)}")
        
        # Display sample high-risk users
        if high_risk_users:
            print(f"\n🚨 TOP 5 HIGH RISK USERS:")
            for user in sorted(high_risk_users, key=lambda u: u.risk_score, reverse=True)[:5]:
                print(f"   • {user.display_name} ({user.email}) - Risk: {user.risk_score}")
        
        return users
        
    except ValueError as e:
        logger.error(f"Configuration error: {str(e)}")
        print(f"❌ Configuration Error: {str(e)}")
        print("\nPlease set the required environment variables:")
        print("export IGA_API_KEY='your_api_key_here'")
        print("export IGA_API_URL='https://console.jumpcloud.com/api'")  # or your IGA platform URL
        print("export IGA_ORG_ID='your_org_id_here'  # if required")
        return []
        
    except Exception as e:
        logger.error(f"Sync failed: {str(e)}")
        print(f"❌ Synchronization failed: {str(e)}")
        return []

if __name__ == "__main__":
    # Example environment setup (remove in production)
    # os.environ['IGA_API_KEY'] = 'your_actual_api_key_here'
    # os.environ['IGA_API_URL'] = 'https://console.jumpcloud.com/api'
    # os.environ['IGA_ORG_ID'] = 'your_org_id_here'
    
    users = main()

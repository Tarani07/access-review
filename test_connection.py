#!/usr/bin/env python3
"""
Connection Test Script for IGA User Sync
Test your IGA API connection before running the full synchronization

Author: SparrowVision Team
Version: 2.0
"""

import os
import sys
import requests
import json
from datetime import datetime
from typing import Dict, Any, Tuple

def test_environment_variables() -> Tuple[bool, Dict[str, Any]]:
    """Test if required environment variables are set"""
    print("🔍 Testing Environment Variables...")
    
    results = {
        'passed': True,
        'required_vars': {},
        'optional_vars': {},
        'missing_vars': []
    }
    
    # Required variables
    required_vars = {
        'IGA_API_URL': 'IGA Platform API URL',
        'IGA_API_KEY': 'IGA Platform API Key'
    }
    
    # Optional variables
    optional_vars = {
        'IGA_ORG_ID': 'Organization ID (required for some platforms)',
        'IGA_TIMEOUT': 'API request timeout',
        'IGA_PAGE_SIZE': 'Number of users per page',
        'IGA_RATE_LIMIT_DELAY': 'Delay between API requests'
    }
    
    # Check required variables
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            results['required_vars'][var] = {
                'value': value[:20] + '...' if len(value) > 20 else value,
                'description': description,
                'status': '✅ Set'
            }
        else:
            results['missing_vars'].append(var)
            results['required_vars'][var] = {
                'value': None,
                'description': description,
                'status': '❌ Missing'
            }
            results['passed'] = False
    
    # Check optional variables
    for var, description in optional_vars.items():
        value = os.getenv(var)
        results['optional_vars'][var] = {
            'value': value or 'Default',
            'description': description,
            'status': '✅ Set' if value else '⚠️  Using Default'
        }
    
    # Print results
    print(f"📋 Required Variables:")
    for var, info in results['required_vars'].items():
        print(f"   • {var}: {info['status']} - {info['description']}")
        if info['value']:
            print(f"     Value: {info['value']}")
    
    print(f"\n📋 Optional Variables:")
    for var, info in results['optional_vars'].items():
        print(f"   • {var}: {info['status']} - {info['description']}")
        print(f"     Value: {info['value']}")
    
    if results['missing_vars']:
        print(f"\n❌ Missing Required Variables: {', '.join(results['missing_vars'])}")
        print("   Please set these environment variables and try again.")
    else:
        print(f"\n✅ All required environment variables are set!")
    
    return results['passed'], results

def test_api_connectivity() -> Tuple[bool, Dict[str, Any]]:
    """Test basic connectivity to the IGA API"""
    print("\n🌐 Testing API Connectivity...")
    
    api_url = os.getenv('IGA_API_URL')
    api_key = os.getenv('IGA_API_KEY')
    org_id = os.getenv('IGA_ORG_ID', '')
    timeout = int(os.getenv('IGA_TIMEOUT', '30'))
    
    results = {
        'passed': False,
        'response_time': None,
        'status_code': None,
        'error': None,
        'api_version': None,
        'rate_limit_info': {}
    }
    
    if not api_url or not api_key:
        results['error'] = "Missing API URL or API Key"
        print("❌ Cannot test connectivity - missing API URL or API Key")
        return False, results
    
    try:
        # Prepare headers
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'SparrowVision-Test/2.0'
        }
        
        if org_id:
            headers['x-org-id'] = org_id
        
        # Test basic connectivity
        start_time = datetime.now()
        
        # Try common API endpoints for different platforms
        test_endpoints = [
            '/organizations',  # Common endpoint
            '/systemusers?limit=1',  # JumpCloud
            '/users?limit=1',  # Okta, Azure AD
            '/admin/directory/v1/users?maxResults=1'  # Google Workspace
        ]
        
        successful_endpoint = None
        
        for endpoint in test_endpoints:
            try:
                test_url = f"{api_url.rstrip('/')}{endpoint}"
                print(f"   Trying: {test_url}")
                
                response = requests.get(
                    test_url,
                    headers=headers,
                    timeout=timeout
                )
                
                end_time = datetime.now()
                results['response_time'] = (end_time - start_time).total_seconds()
                results['status_code'] = response.status_code
                
                # Extract rate limit information if available
                rate_limit_headers = {
                    'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit'),
                    'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
                    'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset'),
                    'Retry-After': response.headers.get('Retry-After')
                }
                results['rate_limit_info'] = {k: v for k, v in rate_limit_headers.items() if v}
                
                if response.status_code == 200:
                    successful_endpoint = endpoint
                    results['passed'] = True
                    
                    # Try to get API version info
                    try:
                        response_data = response.json()
                        if 'version' in response_data:
                            results['api_version'] = response_data['version']
                    except:
                        pass
                    
                    break
                    
            except requests.exceptions.RequestException:
                continue
        
        # Print results
        if results['passed']:
            print(f"✅ API connectivity successful!")
            print(f"   • Endpoint: {successful_endpoint}")
            print(f"   • Status Code: {results['status_code']}")
            print(f"   • Response Time: {results['response_time']:.2f}s")
            
            if results['api_version']:
                print(f"   • API Version: {results['api_version']}")
            
            if results['rate_limit_info']:
                print(f"   • Rate Limit Info:")
                for header, value in results['rate_limit_info'].items():
                    print(f"     - {header}: {value}")
        else:
            print(f"❌ API connectivity failed")
            print(f"   • Status Code: {results['status_code']}")
            if results['response_time']:
                print(f"   • Response Time: {results['response_time']:.2f}s")
    
    except requests.exceptions.Timeout:
        results['error'] = f"Request timeout after {timeout} seconds"
        print(f"❌ Connection timeout after {timeout} seconds")
        
    except requests.exceptions.ConnectionError:
        results['error'] = "Connection error - check network and URL"
        print(f"❌ Connection error - please check network connectivity and API URL")
        
    except Exception as e:
        results['error'] = str(e)
        print(f"❌ Unexpected error: {str(e)}")
    
    return results['passed'], results

def test_authentication() -> Tuple[bool, Dict[str, Any]]:
    """Test API authentication and permissions"""
    print("\n🔐 Testing Authentication & Permissions...")
    
    api_url = os.getenv('IGA_API_URL')
    api_key = os.getenv('IGA_API_KEY')
    org_id = os.getenv('IGA_ORG_ID', '')
    
    results = {
        'passed': False,
        'permissions': {},
        'organization_info': {},
        'error': None
    }
    
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'SparrowVision-Test/2.0'
        }
        
        if org_id:
            headers['x-org-id'] = org_id
        
        # Test organization access
        org_url = f"{api_url.rstrip('/')}/organizations"
        if org_id:
            org_url = f"{org_url}/{org_id}"
        
        try:
            org_response = requests.get(org_url, headers=headers, timeout=30)
            
            if org_response.status_code == 200:
                org_data = org_response.json()
                results['organization_info'] = {
                    'name': org_data.get('displayName', org_data.get('name', 'Unknown')),
                    'id': org_data.get('id', org_data.get('_id', org_id)),
                    'created': org_data.get('created', 'Unknown')
                }
                print(f"✅ Organization access successful")
                print(f"   • Name: {results['organization_info']['name']}")
                print(f"   • ID: {results['organization_info']['id']}")
                
            elif org_response.status_code == 401:
                results['error'] = "Authentication failed - invalid API key"
                print(f"❌ Authentication failed - please check your API key")
                return False, results
                
            elif org_response.status_code == 403:
                results['error'] = "Forbidden - insufficient permissions"
                print(f"❌ Insufficient permissions - check API key permissions")
                return False, results
                
        except requests.exceptions.RequestException as e:
            print(f"⚠️  Organization test failed: {str(e)}")
        
        # Test user access permissions
        user_endpoints = {
            '/systemusers?limit=1': 'System Users (JumpCloud)',
            '/users?limit=1': 'Users (Okta/Azure)',
            '/admin/directory/v1/users?maxResults=1': 'Directory Users (Google)'
        }
        
        for endpoint, description in user_endpoints.items():
            try:
                test_url = f"{api_url.rstrip('/')}{endpoint}"
                response = requests.get(test_url, headers=headers, timeout=30)
                
                results['permissions'][description] = {
                    'status_code': response.status_code,
                    'accessible': response.status_code == 200,
                    'error': None if response.status_code == 200 else response.reason
                }
                
                if response.status_code == 200:
                    print(f"✅ {description}: Accessible")
                    
                    # Try to get sample data
                    try:
                        data = response.json()
                        if 'results' in data:
                            user_count = len(data['results'])
                        elif 'data' in data:
                            user_count = len(data['data'])
                        elif isinstance(data, list):
                            user_count = len(data)
                        else:
                            user_count = 1 if data else 0
                        
                        print(f"   • Sample returned {user_count} user(s)")
                        results['passed'] = True
                        
                    except:
                        print(f"   • Endpoint accessible but response format unclear")
                        results['passed'] = True
                        
                    break  # Stop at first successful endpoint
                    
                else:
                    print(f"❌ {description}: {response.status_code} - {response.reason}")
                    
            except requests.exceptions.RequestException as e:
                results['permissions'][description] = {
                    'status_code': None,
                    'accessible': False,
                    'error': str(e)
                }
                print(f"❌ {description}: Connection error - {str(e)}")
        
        if not results['passed']:
            results['error'] = "No accessible user endpoints found"
            print(f"\n❌ Unable to access user data from any endpoint")
            print(f"   Please check your API permissions for user read access")
        
    except Exception as e:
        results['error'] = f"Authentication test error: {str(e)}"
        print(f"❌ Authentication test failed: {str(e)}")
    
    return results['passed'], results

def test_data_format() -> Tuple[bool, Dict[str, Any]]:
    """Test that we can parse the API data format"""
    print("\n📋 Testing Data Format Compatibility...")
    
    api_url = os.getenv('IGA_API_URL')
    api_key = os.getenv('IGA_API_KEY')
    org_id = os.getenv('IGA_ORG_ID', '')
    
    results = {
        'passed': False,
        'sample_user': {},
        'required_fields': {},
        'optional_fields': {},
        'error': None
    }
    
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'SparrowVision-Test/2.0'
        }
        
        if org_id:
            headers['x-org-id'] = org_id
        
        # Try to get a sample user
        endpoints = [
            '/systemusers?limit=1',
            '/users?limit=1', 
            '/admin/directory/v1/users?maxResults=1'
        ]
        
        sample_user = None
        
        for endpoint in endpoints:
            try:
                url = f"{api_url.rstrip('/')}{endpoint}"
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extract first user from different response formats
                    if 'results' in data and data['results']:
                        sample_user = data['results'][0]
                    elif 'data' in data and data['data']:
                        sample_user = data['data'][0]
                    elif isinstance(data, list) and data:
                        sample_user = data[0]
                    elif 'users' in data and data['users']:
                        sample_user = data['users'][0]
                    
                    if sample_user:
                        break
                        
            except:
                continue
        
        if not sample_user:
            results['error'] = "No sample user data available"
            print("❌ Unable to retrieve sample user data")
            return False, results
        
        # Check for required fields
        required_fields = {
            'id': ['_id', 'id', 'userId'],
            'email': ['email', 'primaryEmail'],
            'first_name': ['firstname', 'firstName', 'given_name', 'givenName'],
            'last_name': ['lastname', 'lastName', 'family_name', 'familyName'],
            'status': ['activated', 'suspended', 'status', 'accountEnabled']
        }
        
        for field_name, possible_keys in required_fields.items():
            found_value = None
            found_key = None
            
            for key in possible_keys:
                if key in sample_user:
                    found_value = sample_user[key]
                    found_key = key
                    break
            
            results['required_fields'][field_name] = {
                'found': found_value is not None,
                'key': found_key,
                'value': str(found_value)[:50] if found_value else None,
                'status': '✅ Found' if found_value is not None else '❌ Missing'
            }
        
        # Check for optional fields
        optional_fields = {
            'username': ['username', 'login', 'userPrincipalName'],
            'department': ['department', 'organization', 'department'],
            'job_title': ['jobTitle', 'title'],
            'phone': ['phoneNumber', 'mobilePhone', 'businessPhones'],
            'groups': ['groups', 'memberOf'],
            'created': ['created', 'createdAt', 'whenCreated'],
            'last_login': ['lastLogin', 'lastSignInDateTime', 'last_login']
        }
        
        for field_name, possible_keys in optional_fields.items():
            found_value = None
            found_key = None
            
            for key in possible_keys:
                if key in sample_user:
                    found_value = sample_user[key]
                    found_key = key
                    break
            
            results['optional_fields'][field_name] = {
                'found': found_value is not None,
                'key': found_key,
                'value': str(found_value)[:50] if found_value else None,
                'status': '✅ Found' if found_value is not None else '⚠️  Not Found'
            }
        
        # Store sanitized sample user
        results['sample_user'] = {
            k: str(v)[:100] + '...' if isinstance(v, str) and len(str(v)) > 100 else v
            for k, v in sample_user.items()
        }
        
        # Check if we have minimum required fields
        required_found = sum(1 for field in results['required_fields'].values() if field['found'])
        total_required = len(results['required_fields'])
        
        results['passed'] = required_found >= 3  # Need at least id, email, and name
        
        # Print results
        print(f"📊 Data Format Analysis:")
        print(f"   • Required Fields Found: {required_found}/{total_required}")
        
        print(f"\n🔍 Required Fields:")
        for field_name, info in results['required_fields'].items():
            print(f"   • {field_name}: {info['status']}")
            if info['found']:
                print(f"     Key: {info['key']}, Value: {info['value']}")
        
        print(f"\n🔍 Optional Fields:")
        for field_name, info in results['optional_fields'].items():
            print(f"   • {field_name}: {info['status']}")
            if info['found']:
                print(f"     Key: {info['key']}")
        
        if results['passed']:
            print(f"\n✅ Data format is compatible with SparrowVision IGA Sync")
        else:
            print(f"\n❌ Data format may have compatibility issues")
            print(f"   Ensure your API provides at least: id, email, and name fields")
    
    except Exception as e:
        results['error'] = f"Data format test error: {str(e)}"
        print(f"❌ Data format test failed: {str(e)}")
    
    return results['passed'], results

def generate_test_report(all_results: Dict[str, Tuple[bool, Dict]]):
    """Generate a comprehensive test report"""
    print("\n" + "=" * 80)
    print("📊 COMPREHENSIVE TEST REPORT")
    print("=" * 80)
    
    report = {
        'timestamp': datetime.now().isoformat(),
        'overall_status': 'PASS',
        'tests': {},
        'summary': {},
        'recommendations': []
    }
    
    # Process test results
    passed_tests = 0
    total_tests = len(all_results)
    
    for test_name, (passed, details) in all_results.items():
        report['tests'][test_name] = {
            'passed': passed,
            'details': details
        }
        
        if passed:
            passed_tests += 1
        else:
            report['overall_status'] = 'FAIL'
    
    report['summary'] = {
        'total_tests': total_tests,
        'passed_tests': passed_tests,
        'failed_tests': total_tests - passed_tests,
        'success_rate': (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    }
    
    # Print summary
    print(f"Overall Status: {'✅ PASS' if report['overall_status'] == 'PASS' else '❌ FAIL'}")
    print(f"Tests Passed: {passed_tests}/{total_tests} ({report['summary']['success_rate']:.1f}%)")
    
    print(f"\n📋 Test Results:")
    for test_name, (passed, _) in all_results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   • {test_name.replace('_', ' ').title()}: {status}")
    
    # Generate recommendations
    if not all_results['environment_variables'][0]:
        report['recommendations'].append({
            'priority': 'HIGH',
            'category': 'Configuration',
            'message': 'Set missing environment variables before running sync'
        })
    
    if not all_results['api_connectivity'][0]:
        report['recommendations'].append({
            'priority': 'HIGH',
            'category': 'Network',
            'message': 'Fix API connectivity issues - check URL and network access'
        })
    
    if not all_results['authentication'][0]:
        report['recommendations'].append({
            'priority': 'HIGH',
            'category': 'Security',
            'message': 'Fix authentication issues - check API key and permissions'
        })
    
    if not all_results['data_format'][0]:
        report['recommendations'].append({
            'priority': 'MEDIUM',
            'category': 'Compatibility',
            'message': 'Review data format compatibility - some fields may not be available'
        })
    
    if report['recommendations']:
        print(f"\n🔧 Recommendations:")
        for rec in report['recommendations']:
            print(f"   • {rec['priority']}: {rec['message']}")
    
    # Save detailed report
    report_filename = f"connection_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_filename, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\n📁 Detailed report saved to: {report_filename}")
    
    # Final recommendation
    if report['overall_status'] == 'PASS':
        print(f"\n🎉 All tests passed! You're ready to run the IGA User Sync.")
        print(f"   Run: python iga_user_sync.py")
    else:
        print(f"\n⚠️  Some tests failed. Please fix the issues above before running the sync.")
        print(f"   Check the detailed report for more information.")
    
    return report

def main():
    """Main test function"""
    print("🧪 SparrowVision IGA Connection Test")
    print("=" * 50)
    print("This script will test your IGA API connection and configuration")
    print("before running the full user synchronization.")
    print("=" * 50)
    
    # Run all tests
    all_results = {}
    
    try:
        all_results['environment_variables'] = test_environment_variables()
        
        # Only run other tests if environment variables are set
        if all_results['environment_variables'][0]:
            all_results['api_connectivity'] = test_api_connectivity()
            all_results['authentication'] = test_authentication()
            all_results['data_format'] = test_data_format()
        else:
            print("\n⏭️  Skipping remaining tests due to missing environment variables")
            all_results['api_connectivity'] = (False, {'error': 'Skipped - missing env vars'})
            all_results['authentication'] = (False, {'error': 'Skipped - missing env vars'})
            all_results['data_format'] = (False, {'error': 'Skipped - missing env vars'})
        
        # Generate comprehensive report
        report = generate_test_report(all_results)
        
        # Exit with appropriate code
        sys.exit(0 if report['overall_status'] == 'PASS' else 1)
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
        sys.exit(1)
        
    except Exception as e:
        print(f"\n❌ Unexpected error during testing: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()

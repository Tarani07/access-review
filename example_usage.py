#!/usr/bin/env python3
"""
Example Usage Script for SparrowVision IGA Integration
This script demonstrates how to use the IGA User Sync for different scenarios

Author: SparrowVision Team
Version: 2.0
"""

import os
import json
import requests
from datetime import datetime
from iga_user_sync import IGAUserRetriever, IGAConfig, IGAUser

def example_basic_sync():
    """Basic user synchronization example"""
    print("=" * 60)
    print("EXAMPLE 1: Basic User Synchronization")
    print("=" * 60)
    
    try:
        # Initialize configuration
        config = IGAConfig()
        retriever = IGAUserRetriever(config)
        
        # Retrieve all users
        print("📥 Fetching users from IGA platform...")
        users = retriever.retrieve_all_users()
        
        print(f"✅ Successfully retrieved {len(users)} users")
        
        # Show first few users
        print(f"\n📋 Sample Users:")
        for user in users[:3]:
            print(f"   • {user.display_name} ({user.email}) - Status: {user.status}")
        
        # Export data
        export_file = retriever.export_users_json()
        print(f"💾 Data exported to: {export_file}")
        
    except Exception as e:
        print(f"❌ Sync failed: {str(e)}")

def example_security_analysis():
    """Security analysis and risk assessment example"""
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Security Analysis & Risk Assessment")
    print("=" * 60)
    
    try:
        config = IGAConfig()
        retriever = IGAUserRetriever(config)
        users = retriever.retrieve_all_users()
        
        # High-risk users analysis
        high_risk_users = retriever.get_high_risk_users(risk_threshold=70)
        print(f"🚨 High Risk Users (Score ≥70): {len(high_risk_users)}")
        
        if high_risk_users:
            print("   Top 5 Highest Risk:")
            for user in sorted(high_risk_users, key=lambda u: u.risk_score, reverse=True)[:5]:
                print(f"   • {user.display_name} - Risk Score: {user.risk_score} - Status: {user.status}")
        
        # Inactive users analysis
        inactive_30 = retriever.get_inactive_users(days=30)
        inactive_90 = retriever.get_inactive_users(days=90)
        
        print(f"\n😴 Inactive Users:")
        print(f"   • 30+ days inactive: {len(inactive_30)}")
        print(f"   • 90+ days inactive: {len(inactive_90)}")
        
        # Privileged users analysis
        privileged_users = retriever.get_privileged_users()
        print(f"\n🔐 Privileged Users: {len(privileged_users)}")
        
        if privileged_users:
            print("   Sample Privileged Users:")
            for user in privileged_users[:3]:
                admin_groups = [g for g in user.groups if 'admin' in g.lower()]
                print(f"   • {user.display_name} - Groups: {', '.join(admin_groups)}")
        
        # Generate security report
        security_report = {
            'timestamp': datetime.now().isoformat(),
            'total_users': len(users),
            'high_risk_users': len(high_risk_users),
            'inactive_30_days': len(inactive_30),
            'inactive_90_days': len(inactive_90),
            'privileged_users': len(privileged_users),
            'risk_distribution': {
                'high_risk': len([u for u in users if u.risk_score >= 70]),
                'medium_risk': len([u for u in users if 40 <= u.risk_score < 70]),
                'low_risk': len([u for u in users if u.risk_score < 40])
            }
        }
        
        with open('security_report.json', 'w') as f:
            json.dump(security_report, f, indent=2)
        
        print(f"\n📊 Security report saved to: security_report.json")
        
    except Exception as e:
        print(f"❌ Security analysis failed: {str(e)}")

def example_sparrowvision_integration():
    """Example of direct integration with SparrowVision API"""
    print("\n" + "=" * 60)
    print("EXAMPLE 3: SparrowVision API Integration")
    print("=" * 60)
    
    # This is a mock example - replace with actual SparrowVision API endpoint
    SPARROWVISION_API_URL = os.getenv('SPARROWVISION_API_URL', 'https://your-instance.sparrowvision.com/api')
    SPARROWVISION_API_KEY = os.getenv('SPARROWVISION_API_KEY', '')
    
    if not SPARROWVISION_API_KEY:
        print("⚠️  SPARROWVISION_API_KEY not configured - skipping integration example")
        return
    
    try:
        # Sync users from IGA
        config = IGAConfig()
        retriever = IGAUserRetriever(config)
        users = retriever.retrieve_all_users()
        
        print(f"📤 Sending {len(users)} users to SparrowVision...")
        
        # Prepare data for SparrowVision
        sparrowvision_payload = {
            'source': 'IGA_SYNC',
            'timestamp': datetime.now().isoformat(),
            'users': []
        }
        
        for user in users:
            sparrowvision_user = {
                'external_id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'department': user.department,
                'job_title': user.job_title,
                'status': user.status,
                'risk_score': user.risk_score,
                'last_login': user.last_login,
                'groups': user.groups
            }
            sparrowvision_payload['users'].append(sparrowvision_user)
        
        # Send to SparrowVision API (mock call)
        headers = {
            'Authorization': f'Bearer {SPARROWVISION_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        # In real implementation, uncomment this:
        # response = requests.post(
        #     f'{SPARROWVISION_API_URL}/users/bulk-import',
        #     headers=headers,
        #     json=sparrowvision_payload
        # )
        # 
        # if response.status_code == 200:
        #     print("✅ Successfully imported users to SparrowVision")
        # else:
        #     print(f"❌ SparrowVision import failed: {response.status_code}")
        
        # For demo purposes, just save the payload
        with open('sparrowvision_import_payload.json', 'w') as f:
            json.dump(sparrowvision_payload, f, indent=2)
        
        print("✅ SparrowVision import payload saved to: sparrowvision_import_payload.json")
        print("   (In production, this would be sent directly to SparrowVision API)")
        
    except Exception as e:
        print(f"❌ SparrowVision integration failed: {str(e)}")

def example_filtering_and_transformation():
    """Example of advanced filtering and data transformation"""
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Advanced Filtering & Transformation")
    print("=" * 60)
    
    try:
        config = IGAConfig()
        retriever = IGAUserRetriever(config)
        users = retriever.retrieve_all_users()
        
        print(f"📊 Analyzing {len(users)} users...")
        
        # Filter by department
        engineering_users = [u for u in users if u.department and 'engineering' in u.department.lower()]
        print(f"👨‍💻 Engineering Users: {len(engineering_users)}")
        
        # Filter by status
        active_users = [u for u in users if u.status == 'ACTIVE']
        suspended_users = [u for u in users if u.status in ['SUSPENDED', 'DEPROVISIONED']]
        
        print(f"✅ Active Users: {len(active_users)}")
        print(f"❌ Suspended/Deprovisioned Users: {len(suspended_users)}")
        
        # Find users with specific permissions
        admin_users = []
        vip_users = []
        
        for user in users:
            user_groups_lower = [g.lower() for g in user.groups]
            
            if any('admin' in g for g in user_groups_lower):
                admin_users.append(user)
            
            if any(keyword in g for g in user_groups_lower for keyword in ['vip', 'executive', 'c-level']):
                vip_users.append(user)
        
        print(f"🔑 Admin Users: {len(admin_users)}")
        print(f"⭐ VIP Users: {len(vip_users)}")
        
        # Department breakdown
        departments = {}
        for user in users:
            dept = user.department or 'Unknown'
            departments[dept] = departments.get(dept, 0) + 1
        
        print(f"\n🏢 Department Breakdown:")
        for dept, count in sorted(departments.items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"   • {dept}: {count} users")
        
        # Create department-specific reports
        for dept, count in departments.items():
            if count >= 10:  # Only create reports for departments with 10+ users
                dept_users = [u for u in users if u.department == dept]
                dept_report = {
                    'department': dept,
                    'total_users': len(dept_users),
                    'active_users': len([u for u in dept_users if u.status == 'ACTIVE']),
                    'average_risk_score': sum(u.risk_score for u in dept_users) / len(dept_users),
                    'high_risk_users': len([u for u in dept_users if u.risk_score >= 70]),
                    'privileged_users': len([u for u in dept_users if any('admin' in g.lower() for g in u.groups)])
                }
                
                filename = f"report_{dept.lower().replace(' ', '_')}.json"
                with open(filename, 'w') as f:
                    json.dump(dept_report, f, indent=2)
                
                print(f"📋 {dept} report saved to: {filename}")
        
    except Exception as e:
        print(f"❌ Filtering analysis failed: {str(e)}")

def example_compliance_reporting():
    """Example of compliance and audit reporting"""
    print("\n" + "=" * 60)
    print("EXAMPLE 5: Compliance & Audit Reporting")
    print("=" * 60)
    
    try:
        config = IGAConfig()
        retriever = IGAUserRetriever(config)
        users = retriever.retrieve_all_users()
        
        # ISO 27001 Access Review Report
        compliance_report = {
            'report_type': 'ISO_27001_ACCESS_REVIEW',
            'generated_at': datetime.now().isoformat(),
            'report_period': 'Q4_2024',
            'auditor': 'SparrowVision_IGA_Sync',
            'total_users_reviewed': len(users),
            'findings': {
                'high_risk_users': len(retriever.get_high_risk_users(70)),
                'inactive_users_30_days': len(retriever.get_inactive_users(30)),
                'inactive_users_90_days': len(retriever.get_inactive_users(90)),
                'privileged_users': len(retriever.get_privileged_users()),
                'users_without_recent_login': len([u for u in users if not u.last_login])
            },
            'recommendations': [],
            'action_items': []
        }
        
        # Generate recommendations based on findings
        if compliance_report['findings']['high_risk_users'] > 0:
            compliance_report['recommendations'].append({
                'priority': 'HIGH',
                'category': 'Risk Management',
                'recommendation': f"Review and remediate {compliance_report['findings']['high_risk_users']} high-risk user accounts",
                'compliance_framework': 'ISO 27001 A.9.2.1'
            })
        
        if compliance_report['findings']['inactive_users_90_days'] > 0:
            compliance_report['recommendations'].append({
                'priority': 'MEDIUM',
                'category': 'Access Management',
                'recommendation': f"Disable or remove {compliance_report['findings']['inactive_users_90_days']} accounts inactive for 90+ days",
                'compliance_framework': 'ISO 27001 A.9.2.6'
            })
        
        if compliance_report['findings']['privileged_users'] > len(users) * 0.1:  # More than 10% privileged
            compliance_report['recommendations'].append({
                'priority': 'MEDIUM',
                'category': 'Privilege Management',
                'recommendation': f"Review privileged access - {compliance_report['findings']['privileged_users']} users have administrative privileges",
                'compliance_framework': 'ISO 27001 A.9.2.3'
            })
        
        # Generate action items
        high_risk_users = retriever.get_high_risk_users(80)
        for user in high_risk_users[:10]:  # Top 10 highest risk
            compliance_report['action_items'].append({
                'type': 'USER_REVIEW',
                'priority': 'HIGH',
                'user_id': user.id,
                'user_email': user.email,
                'risk_score': user.risk_score,
                'action': 'Immediate access review required',
                'due_date': (datetime.now()).strftime('%Y-%m-%d')
            })
        
        # Save compliance report
        with open('iso27001_compliance_report.json', 'w') as f:
            json.dump(compliance_report, f, indent=2)
        
        print("📊 ISO 27001 Compliance Report Generated:")
        print(f"   • Total Users Reviewed: {compliance_report['total_users_reviewed']}")
        print(f"   • High Risk Users: {compliance_report['findings']['high_risk_users']}")
        print(f"   • Inactive 90+ Days: {compliance_report['findings']['inactive_users_90_days']}")
        print(f"   • Privileged Users: {compliance_report['findings']['privileged_users']}")
        print(f"   • Recommendations: {len(compliance_report['recommendations'])}")
        print(f"   • Action Items: {len(compliance_report['action_items'])}")
        print(f"   • Report saved to: iso27001_compliance_report.json")
        
    except Exception as e:
        print(f"❌ Compliance reporting failed: {str(e)}")

def example_monitoring_and_alerting():
    """Example of monitoring and alerting setup"""
    print("\n" + "=" * 60)
    print("EXAMPLE 6: Monitoring & Alerting")
    print("=" * 60)
    
    try:
        config = IGAConfig()
        retriever = IGAUserRetriever(config)
        users = retriever.retrieve_all_users()
        
        # Create monitoring metrics
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'sync_success': True,
            'total_users': len(users),
            'api_calls': retriever.sync_stats['api_calls'],
            'sync_duration': (retriever.sync_stats['end_time'] - retriever.sync_stats['start_time']).total_seconds(),
            'error_count': retriever.sync_stats['errors'],
            'high_risk_users': len(retriever.get_high_risk_users(70)),
            'new_users_since_last_sync': 0,  # Would compare with previous sync
            'alerts': []
        }
        
        # Generate alerts based on thresholds
        if metrics['high_risk_users'] > 10:
            metrics['alerts'].append({
                'severity': 'WARNING',
                'type': 'HIGH_RISK_USERS',
                'message': f'{metrics["high_risk_users"]} users with high risk scores detected',
                'action_required': True
            })
        
        if metrics['sync_duration'] > 300:  # More than 5 minutes
            metrics['alerts'].append({
                'severity': 'INFO',
                'type': 'SLOW_SYNC',
                'message': f'Sync took {metrics["sync_duration"]:.1f} seconds',
                'action_required': False
            })
        
        if metrics['error_count'] > 0:
            metrics['alerts'].append({
                'severity': 'ERROR',
                'type': 'SYNC_ERRORS',
                'message': f'{metrics["error_count"]} errors occurred during sync',
                'action_required': True
            })
        
        # Save metrics for monitoring system
        with open('sync_metrics.json', 'w') as f:
            json.dump(metrics, f, indent=2)
        
        print("📊 Monitoring Metrics:")
        print(f"   • Sync Success: {metrics['sync_success']}")
        print(f"   • Total Users: {metrics['total_users']}")
        print(f"   • Sync Duration: {metrics['sync_duration']:.1f}s")
        print(f"   • API Calls: {metrics['api_calls']}")
        print(f"   • Errors: {metrics['error_count']}")
        print(f"   • Alerts Generated: {len(metrics['alerts'])}")
        
        if metrics['alerts']:
            print("\n🚨 Active Alerts:")
            for alert in metrics['alerts']:
                print(f"   • {alert['severity']}: {alert['message']}")
        
        # Simulate Slack notification (replace with actual webhook)
        slack_payload = {
            'text': f'SparrowVision IGA Sync Complete',
            'blocks': [
                {
                    'type': 'section',
                    'text': {
                        'type': 'mrkdwn',
                        'text': f'*SparrowVision IGA Sync Results*\n• Users: {metrics["total_users"]}\n• Duration: {metrics["sync_duration"]:.1f}s\n• Alerts: {len(metrics["alerts"])}'
                    }
                }
            ]
        }
        
        with open('slack_notification.json', 'w') as f:
            json.dump(slack_payload, f, indent=2)
        
        print(f"📱 Slack notification payload saved to: slack_notification.json")
        
    except Exception as e:
        print(f"❌ Monitoring setup failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 SparrowVision IGA Integration - Example Usage Scenarios")
    print("=" * 80)
    
    # Run all examples
    example_basic_sync()
    example_security_analysis()
    example_sparrowvision_integration()
    example_filtering_and_transformation()
    example_compliance_reporting()
    example_monitoring_and_alerting()
    
    print("\n" + "=" * 80)
    print("✅ All examples completed!")
    print("📁 Check the generated files for detailed outputs:")
    print("   • iga_users_export_*.json - User data export")
    print("   • security_report.json - Security analysis")
    print("   • iso27001_compliance_report.json - Compliance report")
    print("   • sync_metrics.json - Monitoring metrics")
    print("   • Department-specific reports")
    print("=" * 80)

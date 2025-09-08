import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Lock } from 'lucide-react';

interface AccessControlGateProps {
  children: React.ReactNode;
  currentUser: string;
}

export default function AccessControlGate({ children }: AccessControlGateProps) {
  // Authentication removed: always render children
  return <>{children}</>;
}
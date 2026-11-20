import { DemoNotice } from '../DemoNotice';
import React, { useState } from 'react';
import {
  User,
  Shield,
  Layers,
  Terminal,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { LAB_WORKLOAD_IDENTITIES } from '../../data/demoIdentities';
import { WorkloadIdentityRecord } from '../../types/identity';
import { LiveIdentityStatus } from './LiveIdentityStatus';
import { IdentitySummaryCards } from './IdentitySummaryCards';
import { VerificationPipelineHero } from './VerificationPipelineHero';
import { WorkloadIdentitiesTable } from './WorkloadIdentitiesTable';
import { WorkloadDetailDrawer } from './WorkloadDetailDrawer';

interface IdentityAccessViewProps {
  onNavigateToFinding?: (findingId: string) => void;
}

export const IdentityAccessView: React.FC<IdentityAccessViewProps> = ({
  onNavigateToFinding,
}) => {
  const [workloads] = useState<WorkloadIdentityRecord[]>(LAB_WORKLOAD_IDENTITIES);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedWorkload, setSelectedWorkload] = useState<WorkloadIdentityRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleSelectWorkload = (workload: WorkloadIdentityRecord) => {
    setSelectedWorkload(workload);
    setIsDrawerOpen(true);
  };

  const handleSyncCluster = () => {
    setSyncNotice(
      'Demonstration workloads are shown below. Live Kubernetes workloads and ServiceAccounts are queried directly in the top live status panel.'
    );
  };

  return (
    <div className="identity-access-view-container">
      <DemoNotice />
      {/* 1. Official Domain Header */}
      <div className="domain-page-header">
        <div className="domain-header-left">
          <div className="domain-title-row">
            <div className="domain-icon-squircle identity" aria-hidden="true">
              <User size={18} />
            </div>
            <h1 className="domain-page-title">Workload Identity & Service Accounts</h1>
            <span className="domain-live-badge identity">
              <span className="live-pip cyan" />
              INTEGRATED MODULE
            </span>
          </div>
          <div className="domain-meta-subrow">
            <span className="domain-meta-crumb">
              Live Target: <strong>kind-trustmesh-network-lab</strong>
            </span>
            <span className="domain-meta-sep">•</span>
            <span className="domain-meta-crumb">
              Namespace: <strong>trustmesh-integration-test</strong>
            </span>
            <span className="domain-meta-sep">•</span>
            <span className="domain-meta-crumb">
              Attestor: <strong>SPIRE Server / Agent</strong>
            </span>
          </div>
        </div>

        <div className="domain-header-right">
          <button
            className="domain-action-btn"
            onClick={handleSyncCluster}
            title="Explain the identity inventory and live status"
          >
            <RefreshCw size={13} />
            <span>About identity sources</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="sync-notice-banner animate-fade-in">
          <CheckCircle2 size={15} />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* 2. Verified Live Kubernetes Identity & ServiceAccounts Panel */}
      <LiveIdentityStatus />

      {/* 3. Demonstration & Simulated Scenarios Section Header */}
      <div className="demo-section-divider">
        <span className="demo-section-label">DEMONSTRATION SCENARIOS & TRIAGE FIXTURES</span>
      </div>

      {/* 4. Dynamic KPI Summary Cards */}
      <IdentitySummaryCards
        workloads={workloads}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* 5. Verification Pipeline Hero Decision Engine */}
      <VerificationPipelineHero />

      {/* 6. Filterable Workload Identities Table */}
      <div className="identity-table-section">
        <div className="section-header-row">
          <div className="section-title-wrap">
            <Layers size={18} className="section-icon" />
            <h3 className="section-title">Demonstration Workload Catalog</h3>
          </div>
          <div className="section-legend">
            <span className="legend-item">
              <span className="legend-dot green" />
              <span>Projected Token (Audited)</span>
            </span>
            <span className="legend-item">
              <span className="legend-dot amber" />
              <span>Default/Unbound SA (Drift)</span>
            </span>
          </div>
        </div>

        <WorkloadIdentitiesTable
          workloads={workloads}
          onSelectWorkload={handleSelectWorkload}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>

      {/* 7. Workload Detail Drawer (Apple-spring animation) */}
      <WorkloadDetailDrawer
        workload={selectedWorkload}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigateToFinding={onNavigateToFinding}
      />
    </div>
  );
};



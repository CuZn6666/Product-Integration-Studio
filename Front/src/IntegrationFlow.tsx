import { Background, Handle, MarkerType, Position, ReactFlow, type Node, type NodeProps } from '@xyflow/react';
import type { Product, SyncResult } from './api';
import '@xyflow/react/dist/style.css';

type StageState = 'idle' | 'active' | 'done' | 'failed' | 'blocked';
type StageNode = Node<{ title: string; subtitle: string; icon: string; state: StageState }, 'stage'>;
function Stage({ data }: NodeProps<StageNode>) {
  return <div className={`stage stage-${data.state}`}>
    <Handle type="target" position={Position.Left} />
    <span className="stage-icon"><i className={`pi ${data.state === 'active' ? 'pi-spin pi-spinner' : data.icon}`} /></span>
    <div><strong>{data.title}</strong><span>{data.subtitle}</span></div>
    <Handle type="source" position={Position.Right} />
  </div>;
}
const nodeTypes = { stage: Stage };
interface Props {
  product?: Product;
  result?: SyncResult | null;
  busy: boolean;
  error?: string;
}
export default function IntegrationFlow({ product, result, busy, error }: Props) {
  const success = result?.outcome === 'SUCCESS';
  const failure = result?.outcome === 'FAILURE';
  const active = !!product;
  const nodes: StageNode[] = [
    { id: 'plm', type: 'stage', position: { x: 0, y: 0 }, data: { title: 'PLM Input', subtitle: active ? 'Product received' : 'Select a product to sync', icon: 'pi-box', state: active ? 'done' : 'idle' } },
    { id: 'validate', type: 'stage', position: { x: 290, y: 0 }, data: { title: 'Validate & Map', subtitle: busy ? 'Checking product fields…' : success ? 'Validation passed' : failure ? 'Validation failed' : error ? 'Connection interrupted' : 'Check fields & category', icon: failure || error ? 'pi-exclamation-circle' : 'pi-sliders-h', state: busy ? 'active' : success ? 'done' : failure || error ? 'failed' : 'idle' } },
    { id: 'erp', type: 'stage', position: { x: 580, y: 0 }, data: { title: 'ERP Output', subtitle: success ? 'Simulated export complete' : failure ? 'Export blocked' : error ? 'Result unconfirmed' : 'Simulated destination', icon: success ? 'pi-check-circle' : 'pi-database', state: success ? 'done' : failure || error ? 'blocked' : 'idle' } },
  ];
  const edges = [
    { id: 'plm-validation', source: 'plm', target: 'validate', animated: busy, markerEnd: { type: MarkerType.ArrowClosed, color: active ? '#35866b' : '#b5c8c0' }, style: { stroke: active ? '#35866b' : '#b5c8c0', strokeWidth: 2 } },
    { id: 'validation-erp', source: 'validate', target: 'erp', markerEnd: { type: MarkerType.ArrowClosed, color: success ? '#35866b' : '#b5c8c0' }, style: { stroke: success ? '#35866b' : '#b5c8c0', strokeWidth: 2, strokeDasharray: failure || error ? '5 5' : undefined } },
  ];
  const label = busy ? 'Processing' : success ? 'Export complete' : failure ? 'Needs attention' : error ? 'Request interrupted' : 'Ready to sync';
  return <section className="panel flow-panel" aria-label="Integration flow">
    <div className="panel-heading"><div><h2>Integration flow</h2><p>{product ? `${product.name} · ${product.sku}` : 'Choose Sync to ERP on any product to follow its journey.'}</p></div>
      <span className={`flow-state ${success ? 'done' : failure || error ? 'failed' : ''}`} role="status">{label}</span></div>
    <div className="flow-canvas" aria-label="PLM Input to Validate and Map to ERP Output">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.18, maxZoom: 1 }} minZoom={0.2} maxZoom={1}
        nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} nodesFocusable={false} edgesFocusable={false}
        panOnDrag={false} zoomOnScroll={false} zoomOnDoubleClick={false} zoomOnPinch={false} preventScrolling={false}>
        <Background color="#cddbd5" gap={18} size={1} />
      </ReactFlow>
    </div>
    <div className="flow-caption" role="status"><i className={`pi ${failure || error ? 'pi-exclamation-circle' : 'pi-info-circle'}`} />
      {busy ? 'Validating product data and ERP mapping…' : result?.message ?? error ?? 'ERP category is optional for drafts and required for a simulated export.'}</div>
  </section>;
}

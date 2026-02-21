import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Badge, Modal, Input, Select } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { documentService, signatureService, type InsuranceDocument, type SignatureRequest } from '@/services/api/documents';
import {
  FileText, Upload, Download, Trash2, PenTool,
  XCircle, File, Image, FileSpreadsheet,
} from 'lucide-react';

const docTypeLabels: Record<string, string> = {
  application_form: 'Application Form',
  dec_page: 'Declaration Page',
  binder: 'Binder',
  coi: 'Certificate of Insurance',
  endorsement: 'Endorsement',
  id_document: 'ID Document',
  proof_of_loss: 'Proof of Loss',
  other: 'Other',
};

const docTypeOptions = Object.entries(docTypeLabels).map(([value, label]) => ({ value, label }));

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return FileSpreadsheet;
  return FileText;
}

interface Props {
  entityType?: string;
  entityId?: number;
}

export default function Documents({ entityType = 'application', entityId }: Props) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<InsuranceDocument[]>([]);
  const [pendingSignatures, setPendingSignatures] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showSign, setShowSign] = useState<SignatureRequest | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState('other');
  const [uploadTitle, setUploadTitle] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // Fetch documents
  useEffect(() => {
    if (!entityId) {
      setLoading(false);
      return;
    }
    Promise.all([
      documentService.getDocuments(entityType, entityId),
      signatureService.getMyPending(),
    ])
      .then(([docRes, sigRes]) => {
        setDocuments(docRes.documents);
        setPendingSignatures(sigRes.signatures);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  // Upload handler
  const handleUpload = async () => {
    if (!uploadFile || !entityId) return;
    setUploading(true);
    try {
      const res = await documentService.uploadDocument({
        file: uploadFile,
        entity_type: entityType,
        entity_id: entityId,
        type: uploadType,
        title: uploadTitle || undefined,
      });
      setDocuments((prev) => [res.document, ...prev]);
      setShowUpload(false);
      setUploadFile(null);
      setUploadType('other');
      setUploadTitle('');
    } catch {
      // error handled silently
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: InsuranceDocument) => {
    if (!confirm('Delete this document?')) return;
    try {
      await documentService.deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch {
      // silent
    }
  };

  // --- Signature Canvas ---
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (showSign) {
      setTimeout(initCanvas, 100);
    }
  }, [showSign, initCanvas]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawingRef.current = true;
    const { x, y } = getCanvasCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const endDraw = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    initCanvas();
  };

  const handleSign = async () => {
    if (!showSign || !canvasRef.current) return;
    const signatureData = canvasRef.current.toDataURL('image/png');
    try {
      await signatureService.sign(showSign.id, signatureData);
      setPendingSignatures((prev) => prev.filter((s) => s.id !== showSign.id));
      setShowSign(null);
    } catch {
      // error handled silently
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="w-6 h-6 text-teal-600" />
            Documents
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage insurance documents and e-signatures</p>
        </div>
        {entityId && (
          <Button variant="shield" onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4 mr-2" /> Upload
          </Button>
        )}
      </div>

      {/* Pending Signatures Banner */}
      {pendingSignatures.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <PenTool className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">
              {pendingSignatures.length} Signature{pendingSignatures.length > 1 ? 's' : ''} Pending
            </h3>
          </div>
          <div className="space-y-2">
            {pendingSignatures.map((sig) => (
              <div key={sig.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    From {sig.requester?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500">{sig.signer_role} signature</p>
                </div>
                <Button variant="shield" size="sm" onClick={() => setShowSign(sig)}>
                  <PenTool className="w-3.5 h-3.5 mr-1" /> Sign
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No documents yet</p>
            <p className="text-sm text-slate-400 mt-1">Upload documents to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Document</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Size</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Uploaded By</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const FileIcon = getFileIcon(doc.mime_type);
                return (
                  <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
                          <FileIcon className="w-4.5 h-4.5 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{doc.title}</p>
                          <p className="text-xs text-slate-400">{doc.file_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <Badge variant="default" size="sm">{docTypeLabels[doc.type] || doc.type}</Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500 hidden md:table-cell">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500 hidden md:table-cell">
                      {doc.uploader?.name || '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={documentService.getDownloadUrl(doc.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-teal-50 text-slate-400 hover:text-teal-600"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {(doc.uploaded_by === user?.id || ['admin', 'superadmin'].includes(user?.role || '')) && (
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Document">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">File</label>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx,.csv"
            />
          </div>
          <Select
            label="Document Type"
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value)}
            options={docTypeOptions}
          />
          <Input
            label="Title (optional)"
            placeholder="Enter document title"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
          />
          <Button variant="shield" className="w-full" onClick={handleUpload} disabled={!uploadFile} isLoading={uploading}>
            <Upload className="w-4 h-4 mr-2" /> Upload Document
          </Button>
        </div>
      </Modal>

      {/* Signature Canvas Modal */}
      <Modal isOpen={!!showSign} onClose={() => setShowSign(null)} title="Sign Document">
        {showSign && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600">
                <strong>Requested by:</strong> {showSign.requester?.name || 'Unknown'}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                <strong>Role:</strong> {showSign.signer_role.replace('_', ' ')}
              </p>
              {showSign.request_message && (
                <p className="text-sm text-slate-500 mt-2 italic">"{showSign.request_message}"</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Draw your signature below</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
              </div>
              <button onClick={clearCanvas} className="text-xs text-slate-400 hover:text-slate-600 mt-1">
                Clear signature
              </button>
            </div>

            <div className="flex gap-3">
              <Button variant="shield" className="flex-1" onClick={handleSign}>
                <PenTool className="w-4 h-4 mr-2" /> Sign
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  await signatureService.reject(showSign.id);
                  setPendingSignatures((prev) => prev.filter((s) => s.id !== showSign.id));
                  setShowSign(null);
                }}
              >
                <XCircle className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>

            <p className="text-xs text-slate-400 text-center">
              By signing, you agree to the terms of this document. Your IP address and browser information will be recorded.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

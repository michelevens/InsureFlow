import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Badge } from '@/components/ui';
import { Input } from '@/components/ui';
import { marketplaceService, type PublicApplicationView } from '@/services/api';
import {
  ShieldCheck, Loader2, AlertCircle, CheckCircle2,
  Shield, User, Building2, PenTool,
} from 'lucide-react';
import { toast } from 'sonner';

const coverageLabel = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const formatCurrency = (val: string | null | undefined) => val ? `$${Number(val).toLocaleString()}` : '—';

export default function ApplicationSigningPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicApplicationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!token) return;
    marketplaceService.viewApplication(token)
      .then(res => {
        setData(res);
        if (res.is_signed) setSigned(true);
      })
      .catch(() => { setError(true); })
      .finally(() => setLoading(false));
  }, [token]);

  // Canvas drawing
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    setHasDrawn(true);
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSign = async () => {
    if (!token || !signerName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!hasDrawn) {
      toast.error('Please draw your signature');
      return;
    }

    const signatureData = canvasRef.current?.toDataURL('image/png') ?? '';

    setSigning(true);
    try {
      await marketplaceService.signApplication(token, {
        signer_name: signerName,
        signature_data: signatureData,
      });
      setSigned(true);
      toast.success('Application signed successfully!');
    } catch {
      toast.error('Failed to sign application. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shield-50 via-white to-confidence-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-shield-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shield-50 via-white to-confidence-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Application Not Found</h1>
          <p className="text-slate-500">This signing link may have expired or is invalid.</p>
        </Card>
      </div>
    );
  }

  const app = data.application;

  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shield-50 via-white to-confidence-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Signed!</h1>
          <p className="text-slate-600 mb-2">
            Your application <strong>{app.reference}</strong> with <strong>{app.carrier_name}</strong> has been signed and submitted.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Your agent will submit this to the carrier for underwriting. You'll be notified when your policy is issued.
          </p>
          <Link to="/auth/login">
            <Button variant="shield">Sign In to Track</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-shield-50 via-white to-confidence-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-shield-600" />
            <span className="text-xl font-bold text-slate-900">Insurons</span>
          </Link>
          <Badge variant="warning">Pending Signature</Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Application Details */}
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Insurance Application</h1>
          <p className="text-slate-500 mb-4">Reference: {app.reference}</p>

          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-shield-500" />
              <div>
                <p className="text-xs text-slate-400">Carrier</p>
                <p className="text-sm font-medium text-slate-900">{app.carrier_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-shield-500" />
              <div>
                <p className="text-xs text-slate-400">Type</p>
                <p className="text-sm font-medium text-slate-900">{app.insurance_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
              </div>
            </div>
            {app.agent && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Agent</p>
                  <p className="text-sm font-medium text-slate-900">{app.agent.name}</p>
                </div>
              </div>
            )}
            {app.agency && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Agency</p>
                  <p className="text-sm font-medium text-slate-900">{app.agency.name}</p>
                </div>
              </div>
            )}
          </div>

          {app.monthly_premium && Number(app.monthly_premium) > 0 && (
            <div className="mt-4 p-4 bg-savings-50 rounded-lg text-center">
              <p className="text-sm text-savings-600 font-medium">Monthly Premium</p>
              <p className="text-3xl font-bold text-savings-700">{formatCurrency(app.monthly_premium)}<span className="text-lg font-normal">/mo</span></p>
            </div>
          )}
        </Card>

        {/* Coverages */}
        {app.coverages.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Coverage Summary</h2>
            <div className="space-y-2">
              {app.coverages.map(cov => (
                <div key={cov.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-900">{coverageLabel(cov.coverage_type)}</span>
                  <span className="text-sm font-medium text-slate-900">
                    {cov.limit_amount ? `${formatCurrency(cov.limit_amount)} limit` : ''}
                    {cov.deductible_amount ? ` / ${formatCurrency(cov.deductible_amount)} ded.` : ''}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Signature */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PenTool className="w-5 h-5 text-shield-600" />
            <h2 className="text-lg font-semibold text-slate-900">Sign Application</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Legal Name *</label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter your full legal name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Signature *</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={150}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-400">Draw your signature above</p>
                <button type="button" onClick={clearCanvas} className="text-xs text-shield-600 hover:underline">Clear</button>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              By signing, I confirm that I have reviewed this application, all information is accurate, and I authorize
              its submission to <strong>{app.carrier_name}</strong> for underwriting. I understand this is a legally binding electronic signature.
            </p>

            <Button
              variant="shield"
              className="w-full"
              onClick={handleSign}
              disabled={signing || !signerName.trim() || !hasDrawn}
              leftIcon={signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
            >
              {signing ? 'Signing...' : 'Sign & Submit Application'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

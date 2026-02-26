import { CheckCircle2, Star, AlertTriangle, ThumbsUp } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { QuoteComparison } from '@/services/api/marketplace';

interface Props {
  quotes: QuoteComparison[];
  onSelect?: (quoteId: number) => void;
  compact?: boolean;
}

const fmt = (val: string | number | null | undefined) =>
  val != null && val !== '' ? `$${Number(val).toLocaleString()}` : '\u2014';

const fmtRating = (rating: string | null) => {
  if (!rating) return '\u2014';
  const color = rating.startsWith('A+') ? 'text-green-600' : rating.startsWith('A') ? 'text-emerald-600' : 'text-amber-600';
  return <span className={`font-bold ${color}`}>{rating}</span>;
};

export function QuoteComparisonMatrix({ quotes, onSelect, compact }: Props) {
  if (quotes.length === 0) return null;

  const sorted = [...quotes].sort((a, b) => {
    if (a.is_recommended && !b.is_recommended) return -1;
    if (!a.is_recommended && b.is_recommended) return 1;
    return Number(a.premium_monthly) - Number(b.premium_monthly);
  });

  const lowestPremium = Math.min(...sorted.map(q => Number(q.premium_monthly)).filter(p => p > 0));
  const highestPremium = Math.max(...sorted.map(q => Number(q.premium_monthly)).filter(p => p > 0));
  const savings = highestPremium - lowestPremium;

  return (
    <div className="space-y-4">
      {/* Savings callout */}
      {savings > 0 && quotes.length > 1 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-savings-50 border border-savings-200">
          <Star className="w-5 h-5 text-savings-600 flex-shrink-0" />
          <p className="text-sm text-savings-700 font-medium">
            Save up to <span className="font-bold">${savings.toLocaleString()}/mo</span> by comparing carriers
          </p>
        </div>
      )}

      {/* Comparison table */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 rounded-tl-lg w-36">
                {' '}
              </th>
              {sorted.map(q => (
                <th key={q.id} className={`text-center py-3 px-4 min-w-[160px] bg-slate-50 last:rounded-tr-lg ${q.is_recommended ? 'bg-shield-50' : ''}`}>
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-bold text-slate-900 text-base">{q.carrier_name}</span>
                    {q.product_name && <span className="text-xs text-slate-500">{q.product_name}</span>}
                    {q.is_recommended && (
                      <Badge variant="success" className="text-[10px]">
                        <ThumbsUp className="w-3 h-3 mr-1" />Recommended
                      </Badge>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* AM Best Rating */}
            <tr className="border-b border-slate-100">
              <td className="py-2.5 px-3 text-slate-600 font-medium">AM Best Rating</td>
              {sorted.map(q => (
                <td key={q.id} className={`text-center py-2.5 px-4 ${q.is_recommended ? 'bg-shield-50/30' : ''}`}>
                  {fmtRating(q.am_best_rating)}
                </td>
              ))}
            </tr>

            {/* Financial Strength */}
            {sorted.some(q => q.financial_strength_score != null) && (
              <tr className="border-b border-slate-100">
                <td className="py-2.5 px-3 text-slate-600 font-medium">Financial Strength</td>
                {sorted.map(q => (
                  <td key={q.id} className={`text-center py-2.5 px-4 ${q.is_recommended ? 'bg-shield-50/30' : ''}`}>
                    {q.financial_strength_score != null ? (
                      <span className="font-semibold">{q.financial_strength_score}/10</span>
                    ) : '\u2014'}
                  </td>
                ))}
              </tr>
            )}

            {/* Section: Premiums */}
            <tr className="bg-slate-50">
              <td colSpan={sorted.length + 1} className="py-2 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider">
                Premiums
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-3 px-3 text-slate-600 font-medium">Monthly</td>
              {sorted.map(q => {
                const isLowest = Number(q.premium_monthly) === lowestPremium && quotes.length > 1;
                return (
                  <td key={q.id} className={`text-center py-3 px-4 ${q.is_recommended ? 'bg-shield-50/30' : ''}`}>
                    <span className={`text-lg font-bold ${isLowest ? 'text-savings-600' : 'text-slate-900'}`}>
                      {fmt(q.premium_monthly)}
                    </span>
                    <span className="text-slate-500">/mo</span>
                    {isLowest && <div className="text-[10px] text-savings-600 font-medium mt-0.5">Lowest</div>}
                  </td>
                );
              })}
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2.5 px-3 text-slate-600 font-medium">Annual</td>
              {sorted.map(q => (
                <td key={q.id} className={`text-center py-2.5 px-4 text-slate-700 ${q.is_recommended ? 'bg-shield-50/30' : ''}`}>
                  {fmt(q.premium_annual)}/yr
                </td>
              ))}
            </tr>

            {/* Discounts */}
            {sorted.some(q => q.discounts_applied && q.discounts_applied.length > 0) && (
              <>
                <tr className="bg-slate-50">
                  <td colSpan={sorted.length + 1} className="py-2 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Discounts Applied
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 px-3 text-slate-600 font-medium">Discounts</td>
                  {sorted.map(q => (
                    <td key={q.id} className={`py-2.5 px-4 ${q.is_recommended ? 'bg-shield-50/30' : ''}`}>
                      {q.discounts_applied && q.discounts_applied.length > 0 ? (
                        <ul className="text-xs space-y-0.5">
                          {q.discounts_applied.map((d, i) => (
                            <li key={i} className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />{d}
                            </li>
                          ))}
                        </ul>
                      ) : <span className="text-slate-400 text-xs">None</span>}
                    </td>
                  ))}
                </tr>
              </>
            )}

            {/* Endorsements */}
            {!compact && sorted.some(q => q.endorsements && q.endorsements.length > 0) && (
              <>
                <tr className="bg-slate-50">
                  <td colSpan={sorted.length + 1} className="py-2 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Endorsements & Add-ons
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 px-3 text-slate-600 font-medium">Included</td>
                  {sorted.map(q => (
                    <td key={q.id} className={`py-2.5 px-4 ${q.is_recommended ? 'bg-shield-50/30' : ''}`}>
                      {q.endorsements && q.endorsements.length > 0 ? (
                        <ul className="text-xs space-y-0.5">
                          {q.endorsements.map((e, i) => (
                            <li key={i} className="flex items-start gap-1 text-shield-600">
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" />{e}
                            </li>
                          ))}
                        </ul>
                      ) : <span className="text-slate-400 text-xs">\u2014</span>}
                    </td>
                  ))}
                </tr>
              </>
            )}

            {/* Exclusions */}
            {!compact && sorted.some(q => q.exclusions && q.exclusions.length > 0) && (
              <>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 px-3 text-slate-600 font-medium">Exclusions</td>
                  {sorted.map(q => (
                    <td key={q.id} className={`py-2.5 px-4 ${q.is_recommended ? 'bg-shield-50/30' : ''}`}>
                      {q.exclusions && q.exclusions.length > 0 ? (
                        <ul className="text-xs space-y-0.5">
                          {q.exclusions.map((ex, i) => (
                            <li key={i} className="flex items-start gap-1 text-amber-600">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />{ex}
                            </li>
                          ))}
                        </ul>
                      ) : <span className="text-slate-400 text-xs">\u2014</span>}
                    </td>
                  ))}
                </tr>
              </>
            )}

            {/* Agent Notes */}
            {!compact && sorted.some(q => q.agent_notes) && (
              <>
                <tr className="bg-slate-50">
                  <td colSpan={sorted.length + 1} className="py-2 px-3 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Agent Notes
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 px-3 text-slate-600 font-medium">Notes</td>
                  {sorted.map(q => (
                    <td key={q.id} className={`py-2.5 px-4 text-xs text-slate-600 ${q.is_recommended ? 'bg-shield-50/30' : ''}`}>
                      {q.agent_notes || '\u2014'}
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Select buttons */}
      {onSelect && (
        <div className="flex gap-3">
          {sorted.map(q => (
            <Button
              key={q.id}
              variant={q.is_recommended ? 'shield' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => onSelect(q.id)}
            >
              Select {q.carrier_name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

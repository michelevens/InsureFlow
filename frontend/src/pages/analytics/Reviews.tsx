import { useState } from 'react';
import { Card, Badge, Button, Textarea } from '@/components/ui';
import { Star, MessageSquare, ThumbsUp, TrendingUp, Clock, Reply } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  insurance_type: string;
  response?: string;
  helpful_count: number;
}

const mockReviews: Review[] = [
  { id: '1', author: 'Mike Peterson', rating: 5, text: 'Excellent service! Found me an auto policy that saved me $300/year compared to what I was paying. Super responsive and professional throughout the process.', date: '2026-02-15', insurance_type: 'Auto', helpful_count: 12 },
  { id: '2', author: 'Lisa Rodriguez', rating: 5, text: 'She bundled my home and auto policies and saved me a ton. Explained everything clearly and made the process simple.', date: '2026-02-10', insurance_type: 'Home + Auto', response: 'Thank you Lisa! It was a pleasure helping you find the right coverage. Don\'t hesitate to reach out if you need anything.', helpful_count: 8 },
  { id: '3', author: 'James Kim', rating: 4, text: 'Great service overall. Helped me understand my coverage options for my small business. The only thing I would improve is the response time for follow-up questions.', date: '2026-01-28', insurance_type: 'Business', helpful_count: 5 },
  { id: '4', author: 'Rachel Green', rating: 5, text: 'Best insurance experience I\'ve ever had. Got me a life insurance policy with great terms. Highly recommend!', date: '2026-01-20', insurance_type: 'Life', helpful_count: 15 },
  { id: '5', author: 'Tom Anderson', rating: 3, text: 'Good agent but took longer than expected to get quotes back. The final policy was good though.', date: '2026-01-15', insurance_type: 'Auto', helpful_count: 2 },
];

export default function Reviews() {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const avgRating = (mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length).toFixed(1);
  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    stars: r,
    count: mockReviews.filter(rev => rev.rating === r).length,
    pct: Math.round((mockReviews.filter(rev => rev.rating === r).length / mockReviews.length) * 100),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
        <p className="text-slate-500 mt-1">Client feedback and ratings for your services</p>
      </div>

      {/* Rating summary */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <p className="text-5xl font-bold text-slate-900 mb-1">{avgRating}</p>
          <div className="flex items-center justify-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-5 h-5 ${i < Math.round(Number(avgRating)) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
            ))}
          </div>
          <p className="text-sm text-slate-500">Based on {mockReviews.length} reviews</p>
        </Card>

        <Card className="p-6 col-span-2">
          <div className="space-y-2">
            {ratingCounts.map(r => (
              <div key={r.stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-medium text-slate-700">{r.stars}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-sm text-slate-500 w-12 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {mockReviews.map(review => (
          <Card key={review.id}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-shield-100 text-shield-700 flex items-center justify-center text-sm font-bold">
                    {review.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{review.author}</p>
                      <Badge variant="outline" className="text-xs">{review.insurance_type}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">{review.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  <ThumbsUp className="w-4 h-4" />
                  {review.helpful_count}
                </div>
              </div>

              <p className="text-slate-600 mb-3">{review.text}</p>

              {review.response && (
                <div className="bg-shield-50 rounded-xl p-4 mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Reply className="w-4 h-4 text-shield-600" />
                    <span className="text-sm font-medium text-shield-700">Your Response</span>
                  </div>
                  <p className="text-sm text-slate-600">{review.response}</p>
                </div>
              )}

              {!review.response && (
                <>
                  {replyingTo === review.id ? (
                    <div className="mt-3 space-y-3">
                      <Textarea
                        placeholder="Write your response..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button variant="shield" size="sm">Post Response</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(review.id)}>
                      <MessageSquare className="w-4 h-4 mr-1" /> Reply
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

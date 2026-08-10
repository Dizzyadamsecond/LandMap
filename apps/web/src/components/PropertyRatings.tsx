'use client';

import { useState } from 'react';
import { Star } from './lovable/icons';
import { Card, Badge } from '@landmap/ui';

export function PropertyRatings({ propertyId }: { propertyId: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Mock ratings data
  const averageRating = 4.2;
  const totalRatings = 24;
  const ratingsBreakdown = [5, 12, 5, 2, 0];

  const handleSubmit = () => {
    if (rating) {
      setSubmitted(true);
      setTimeout(() => {
        setRating(null);
        setSubmitted(false);
      }, 2000);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4">
      <div className="mb-4 flex items-center gap-2">
        <Star className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Avaliações da comunidade</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Average rating */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{averageRating.toFixed(1)}</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < Math.floor(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{totalRatings} avaliações</p>
        </div>

        {/* Rating input */}
        <div>
          <p className="text-xs font-medium mb-2">Avaliar esta região:</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition hover:scale-110"
              >
                <Star
                  className={`h-4 w-4 cursor-pointer ${
                    rating && star <= rating
                      ? 'fill-primary text-primary'
                      : 'text-gray-300 hover:text-primary'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating && !submitted && (
            <button
              onClick={handleSubmit}
              className="mt-2 inline-flex text-[10px] font-medium text-primary hover:underline"
            >
              Enviar ✓
            </button>
          )}
          {submitted && <p className="mt-2 text-[10px] font-medium text-green-500">Obrigado! ✓</p>}
        </div>
      </div>

      {/* Rating breakdown */}
      <div className="mt-4 space-y-1.5 border-t border-border/50 pt-3">
        {[5, 4, 3, 2, 1].map((stars, idx) => (
          <div key={stars} className="flex items-center gap-2 text-xs">
            <span className="w-4 text-right">{stars}★</span>
            <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${(ratingsBreakdown[5 - stars - 1] / totalRatings) * 100}%` }}
              />
            </div>
            <span className="w-6 text-muted-foreground">{ratingsBreakdown[5 - stars - 1]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Copy, Check, TrendingUp } from "lucide-react";

interface EmailVariation {
  id: string;
  segment: string;
  segmentType: string;
  subject: string;
  preheader: string;
  emphasis: string[];
  tone: string;
  predictedLift: number;
  color: string;
  icon: string;
  subscriberCount: number;
}

export default function EmailVariationsDisplay() {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const variations: EmailVariation[] = [
    {
      id: '1',
      segment: 'Day Traders',
      segmentType: 'Active Trader',
      subject: '🚨 VIX Spike Alert: Quick Profits in Today\'s Volatility',
      preheader: 'Three options plays for the next 2 hours',
      emphasis: ['Quick gains', 'Volatility plays', 'Intraday opportunities'],
      tone: 'Urgent',
      predictedLift: 92,
      color: 'border-yellow-600/50 bg-yellow-900/10 hover:bg-yellow-900/20',
      icon: '⚡',
      subscriberCount: 4250
    },
    {
      id: '2',
      segment: 'Long-term Investors',
      segmentType: 'Value Investor',
      subject: 'Fed Decision: Portfolio Rebalancing Opportunities',
      preheader: 'Quality dividend stocks at attractive valuations',
      emphasis: ['Value analysis', 'Fundamentals', 'Long-term growth'],
      tone: 'Analytical',
      predictedLift: 78,
      color: 'border-blue-600/50 bg-blue-900/10 hover:bg-blue-900/20',
      icon: '📊',
      subscriberCount: 8500
    },
    {
      id: '3',
      segment: 'Options Traders',
      segmentType: 'Derivatives Expert',
      subject: 'Unusual Options Activity: Smart Money Moves',
      preheader: 'High IV rank setups with positive theta',
      emphasis: ['Greeks analysis', 'Premium strategies', 'Risk/reward'],
      tone: 'Technical',
      predictedLift: 85,
      color: 'border-purple-600/50 bg-purple-900/10 hover:bg-purple-900/20',
      icon: '🎯',
      subscriberCount: 3200
    },
    {
      id: '4',
      segment: 'Crypto Enthusiasts',
      segmentType: 'Digital Asset Investor',
      subject: 'BTC Breaking: Institutional Accumulation Patterns',
      preheader: 'DeFi opportunities amid market shift',
      emphasis: ['DeFi yields', 'Altcoin analysis', 'On-chain metrics'],
      tone: 'Innovative',
      predictedLift: 88,
      color: 'border-green-600/50 bg-green-900/10 hover:bg-green-900/20',
      icon: '₿',
      subscriberCount: 5700
    }
  ];

  const handleCopy = (variation: EmailVariation) => {
    navigator.clipboard.writeText(variation.subject);
    setCopiedId(variation.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-white">
            Personalized Email Variations
          </CardTitle>
          <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
            AI-Optimized
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {variations.map((variation) => (
            <div
              key={variation.id}
              className={`relative border-2 rounded-lg p-4 transition-all ${variation.color}`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">{variation.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white text-base">
                      {variation.segment}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className="mt-1 text-xs border-slate-600 text-slate-400"
                    >
                      {variation.segmentType}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-400">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-semibold">+{variation.predictedLift}%</span>
                  </div>
                  <p className="text-xs text-slate-400">predicted lift</p>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3 border-t border-slate-700/50 pt-3">
                {/* Subject Line */}
                <div className="bg-slate-900/50 rounded p-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
                    Subject Line
                  </p>
                  <p className="text-slate-200 text-sm font-medium">
                    {variation.subject}
                  </p>
                </div>

                {/* Preheader */}
                <div className="bg-slate-900/50 rounded p-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
                    Preview Text
                  </p>
                  <p className="text-slate-300 text-sm">
                    {variation.preheader}
                  </p>
                </div>

                {/* Emphasis Points */}
                <div className="flex flex-wrap gap-1">
                  {variation.emphasis.map((point, idx) => (
                    <Badge 
                      key={idx}
                      className="text-xs bg-slate-700/50 text-slate-300 border-slate-600"
                    >
                      {point}
                    </Badge>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{variation.subscriberCount.toLocaleString()} subscribers</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {variation.tone}
                    </Badge>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 text-xs hover:bg-slate-700"
                      onClick={() => handleCopy(variation)}
                    >
                      {copiedId === variation.id ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 text-xs hover:bg-slate-700"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 text-xs hover:bg-slate-700"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">4</p>
              <p className="text-xs text-slate-400">Variations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">86%</p>
              <p className="text-xs text-slate-400">Avg. Lift</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">21.6K</p>
              <p className="text-xs text-slate-400">Total Reach</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">A+</p>
              <p className="text-xs text-slate-400">AI Score</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
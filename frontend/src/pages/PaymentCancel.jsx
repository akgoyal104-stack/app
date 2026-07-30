import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-16">
      <Card className="glass border-white/10 max-w-md w-full">
        <CardContent className="p-10 text-center">
          <XCircle className="w-14 h-14 text-slate-500 mx-auto mb-4" strokeWidth={1.2} />
          <h1 className="text-3xl font-serif-display text-white mb-2">Payment cancelled</h1>
          <p className="text-slate-400 mb-8">No worries — the stars will wait.</p>
          <Link to="/pricing"><Button className="bg-gold text-black hover:bg-amber-300 rounded-full px-8">Back to pricing</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { recordQuoteViewedAction } from "@/app/quote/actions";

export function QuoteViewTracker({ token }: { token: string }) {
  useEffect(() => {
    recordQuoteViewedAction(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

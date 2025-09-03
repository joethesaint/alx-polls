"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface PollQRCodeProps {
  pollId: string;
  size?: number;
}

export default function PollQRCode({ pollId, size = 128 }: PollQRCodeProps) {
  const [copied, setCopied] = useState(false);

  // Generate the full URL for the poll
  const pollUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/polls/${pollId}`
      : `/polls/${pollId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);

      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <QRCodeSVG
          value={pollUrl}
          size={size}
          level="H" // High error correction capability
          includeMargin={true}
        />
      </div>

      <div className="flex flex-col items-center space-y-2 w-full">
        <p className="text-sm text-gray-500">Scan to vote or share the link:</p>
        <div className="flex items-center w-full max-w-xs">
          <input
            type="text"
            value={pollUrl}
            readOnly
            className="flex-1 text-sm border rounded-l-md py-2 px-3 bg-gray-50"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn btn-primary text-sm"
            style={{ borderRadius: "0 50px 50px 0" }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
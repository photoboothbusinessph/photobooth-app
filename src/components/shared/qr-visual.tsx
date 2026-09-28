import { cn } from "@/lib/utils";

const pattern = [
  "111111100101101111111", "100000101110101000001", "101110100011101011101", "101110101010101011101", "101110100101101011101", "100000101011001000001", "111111101010101111111",
  "000000001101100000000", "110101110011011001101", "001011001101100110010", "111001111010111101001", "010110001111000011110", "101011101001111010101", "000000001110001010010",
  "111111101011111010111", "100000100110001000101", "101110101101111110111", "101110100011000010100", "101110101110111011101", "100000101001001010010", "111111101110111011101",
];

export function QrVisual({ className, label = "Sample QR code" }: { className?: string; label?: string }) {
  return (
    <div className={cn("aspect-square w-full bg-white p-[8%]", className)} role="img" aria-label={label}>
      <div className="grid h-full w-full grid-cols-[repeat(21,minmax(0,1fr))]">
        {pattern.flatMap((row, rowIndex) => row.split("").map((cell, columnIndex) => (
          <span key={`${rowIndex}-${columnIndex}`} className={cell === "1" ? "bg-black" : "bg-white"} />
        )))}
      </div>
    </div>
  );
}

import { useMemo } from "react";

export function QrCodeDisplay({ value, size }: { value: string; size: number }) {
  const matrixSize = 29;
  const cells = useMemo(() => {
    let seed = 0;
    for (let index = 0; index < value.length; index += 1) seed = (seed * 31 + value.charCodeAt(index)) >>> 0;

    const inFinder = (row: number, col: number, rowStart: number, colStart: number) => {
      const y = row - rowStart;
      const x = col - colStart;
      if (y < 0 || y > 6 || x < 0 || x > 6) return null;
      return y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4);
    };

    return Array.from({ length: matrixSize * matrixSize }, (_, index) => {
      const row = Math.floor(index / matrixSize);
      const col = index % matrixSize;
      const finder =
        inFinder(row, col, 1, 1) ??
        inFinder(row, col, 1, matrixSize - 8) ??
        inFinder(row, col, matrixSize - 8, 1);
      if (finder !== null) return finder;
      if (row < 9 && col < 9) return false;
      if (row < 9 && col > matrixSize - 10) return false;
      if (row > matrixSize - 10 && col < 9) return false;
      if (row === 8 || col === 8) return (row + col) % 2 === 0;

      const mix = (row * 73856093) ^ (col * 19349663) ^ seed;
      const diagonal = (row + col + seed) % 11 === 0;
      return diagonal || (mix % 13) < 5;
    });
  }, [value]);

  return (
    <div className="qr-card">
      <div className="qr-code" style={{ width: size, height: size, gridTemplateColumns: `repeat(${matrixSize}, 1fr)` }}>
        {cells.map((on, index) => <span key={index} className={on ? "on" : ""} />)}
      </div>
    </div>
  );
}

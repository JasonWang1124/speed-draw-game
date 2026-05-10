import { forwardRef } from "react";
import { motion } from "framer-motion";

// 換人作答：選手 chip 列 + 輸入欄
// props:
//   players: number             玩家總數
//   playerNames: string[]
//   mainPlayerIdx: number       原主答題者（不可選）
//   stealTried: Set<number>     已試過的選手
//   stealActiveIdx: number|null 目前選中的搶答者
//   onPick: (playerIdx) => void
//   onSubmit: () => void
//   onCancelPick: () => void
//   onGiveUp: () => void        跳過揭曉答案
const StealPanel = forwardRef(function StealPanel(
  { players, playerNames, mainPlayerIdx, stealTried, stealActiveIdx, onPick, onSubmit, onCancelPick, onGiveUp },
  ref
) {
  return (
    <>
      <div className="text-center mb-3">
        <div className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-buttercup to-coral bg-clip-text text-transparent">
          🎯 換人作答
        </div>
        <div className="text-deep/60 text-sm mt-1">點選一位選手由他作答（答對 +1，答錯該選手不能再選）</div>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-4">
        {Array.from({ length: players }).map((_, i) => {
          if (i === mainPlayerIdx) return null;
          const tried = stealTried.has(i);
          const active = stealActiveIdx === i;
          return (
            <motion.button
              key={i}
              whileHover={!tried ? { scale: 1.05 } : {}}
              whileTap={!tried ? { scale: 0.92 } : {}}
              onClick={() => onPick(i)}
              disabled={tried}
              className={`px-4 py-2 rounded-full font-black border-3 ${
                active
                  ? "bg-gradient-to-br from-buttercup to-coral text-white border-deep shadow-[3px_3px_0_#2d1b4e]"
                  : tried
                    ? "bg-deep/10 text-deep/40 border-deep/20 line-through"
                    : "bg-white text-deep border-deep shadow-[3px_3px_0_#2d1b4e]"
              }`}
            >
              {playerNames[i]}
            </motion.button>
          );
        })}
      </div>

      {stealActiveIdx != null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <input
            ref={ref}
            type="text"
            placeholder={`${playerNames[stealActiveIdx]} 的答案`}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
            }}
            className="w-full text-center text-2xl font-black p-4 rounded-2xl border-3 border-buttercup bg-cream focus:outline-none focus:ring-4 focus:ring-buttercup/50 mt-2"
          />
          <div className="flex gap-2 mt-3 justify-center">
            <button onClick={onSubmit} className="btn-pop">送出</button>
            <button onClick={onCancelPick} className="btn-soft">取消</button>
          </div>
        </motion.div>
      )}

      <div className="text-center mt-4">
        <button onClick={onGiveUp} className="text-deep/60 text-sm underline">
          跳過 → 揭曉答案
        </button>
      </div>
    </>
  );
});

export default StealPanel;

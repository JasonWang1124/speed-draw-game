import { forwardRef } from "react";
import { motion } from "framer-motion";

// 答題輸入框 + 送出/換人按鈕 + 錯誤嘗試記錄
// props:
//   shakeKey: number          每次答錯遞增，觸發抖動動畫
//   wrongCount: number
//   maxWrongs: number
//   attempts: string[]        錯誤紀錄
//   onSubmit: () => void
//   onSkip: () => void
const AnswerInput = forwardRef(function AnswerInput(
  { shakeKey, wrongCount, maxWrongs, attempts, onSubmit, onSkip },
  ref
) {
  return (
    <>
      <div className={`text-center text-sm font-bold mb-2 ${wrongCount >= maxWrongs ? "text-coral" : "text-deep/60"}`}>
        錯誤 {wrongCount} / {maxWrongs}
      </div>

      <motion.input
        ref={ref}
        key={shakeKey}
        animate={shakeKey > 0 ? { x: [-10, 10, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        type="text"
        placeholder="輸入答案後按 Enter"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        className="w-full text-center text-2xl sm:text-3xl font-black p-4 rounded-2xl border-3 border-deep bg-cream focus:bg-white focus:outline-none focus:ring-4 focus:ring-coral/40 placeholder:text-deep/30 placeholder:font-bold"
      />

      <div className="flex gap-2 sm:gap-3 mt-3 justify-center">
        <button onClick={onSubmit} className="btn-pop flex-1">送出答案</button>
        <button onClick={onSkip} className="btn-soft">換人作答</button>
      </div>

      {attempts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {attempts.map((a, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full bg-coral/15 text-coral text-sm font-bold line-through border border-coral/30"
            >
              {a}
            </span>
          ))}
        </div>
      )}
    </>
  );
});

export default AnswerInput;

import { motion } from "framer-motion";

// 答題倒數計時（顯示剩餘秒數 + 進度條）
// props:
//   timeLeft: number   剩餘秒數
//   total: number      總秒數（用於進度條動畫）
//   resetKey: any      變化即重啟動畫
export default function CountdownTimer({ timeLeft, total, resetKey }) {
  return (
    <div className="mb-3">
      <div
        className={`text-center text-3xl sm:text-4xl font-black mb-1 ${
          timeLeft <= 3 ? "text-coral animate-shake" : timeLeft <= 5 ? "text-buttercup" : "text-deep"
        }`}
      >
        {timeLeft} 秒
      </div>
      <div className="h-3 rounded-full bg-deep/10 overflow-hidden border-2 border-deep/15">
        <motion.div
          key={resetKey}
          className="h-full"
          style={{
            originX: 0,
            background:
              timeLeft <= 3
                ? "linear-gradient(90deg, #ff7a8a, #ffafcc)"
                : "linear-gradient(90deg, #b6e2d3, #ff7a8a)",
          }}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: total, ease: "linear" }}
        />
      </div>
    </div>
  );
}

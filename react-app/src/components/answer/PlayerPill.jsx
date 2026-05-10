import { motion } from "framer-motion";

// 上方輪播主答題者標籤
// props:
//   stage: "answering" | "steal" | "result"
//   activeName: string         目前要答題的人名（answering 主答 / steal 已選搶答者）
//   pickingSteal: boolean      steal 階段但還沒選搶答者
//   roundKey: any              變化即重觸發進場動畫
export default function PlayerPill({ stage, activeName, pickingSteal, roundKey }) {
  const bg =
    stage === "steal" && !pickingSteal
      ? "linear-gradient(135deg, #ffd66e, #ff7a8a)"
      : stage === "steal"
        ? "linear-gradient(135deg, #b388ff, #ffafcc)"
        : "linear-gradient(135deg, #ff7a8a, #b388ff)";

  return (
    <motion.div
      key={roundKey}
      initial={{ scale: 0.6, y: -10 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: "spring" }}
      className="px-6 py-2 rounded-full font-black text-white text-lg sm:text-xl shadow-[3px_3px_0_#2d1b4e] border-3 border-deep"
      style={{ background: bg }}
    >
      {pickingSteal ? "🎯 點選一位選手作答" : `🎤 ${activeName}`}
    </motion.div>
  );
}

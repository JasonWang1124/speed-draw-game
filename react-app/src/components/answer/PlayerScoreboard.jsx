import { motion } from "framer-motion";

const COLORS = ["#ffb4a2", "#ffd66e", "#b6e2d3", "#a8dadc", "#b388ff", "#ff7a8a", "#ffafcc", "#bde0fe", "#caffbf", "#ffd6a5"];

// 底部分數板
// props:
//   players: number
//   playerNames: string[]
//   scores: number[]
//   highlightIdx?: number   邊框加粗高亮（目前主答題者）
//   pulseIdx?: number       彈跳動畫（剛得分的玩家）
export default function PlayerScoreboard({ players, playerNames, scores, highlightIdx = null, pulseIdx = null }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {Array.from({ length: players }).map((_, i) => (
        <motion.div
          key={i}
          animate={i === pulseIdx ? { scale: [1, 1.1, 1] } : {}}
          className="rounded-2xl p-2 sm:p-3 border-2 text-center"
          style={{
            background: COLORS[i % COLORS.length],
            borderColor: i === highlightIdx ? "#2d1b4e" : "rgba(45,27,78,0.15)",
            borderWidth: i === highlightIdx ? "3px" : "2px",
          }}
        >
          <div className="text-xs font-bold text-deep/70 truncate">{playerNames[i]}</div>
          <div className="text-2xl sm:text-3xl font-black text-deep">{scores[i]}</div>
        </motion.div>
      ))}
    </div>
  );
}

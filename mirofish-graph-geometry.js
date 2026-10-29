/**
 * Adapted from MiroFish frontend/src/components/GraphPanel.vue, lines 500–569.
 * Upstream: https://github.com/666ghj/MiroFish
 * Commit: 7657031ac01184afe2cb220f5ee3545573b5e843
 * License: GNU Affero General Public License v3.0 (see ../LICENSE.txt).
 *
 * CIBE changes, 2026-10-28:
 * - Extracted getLinkPath and getLinkMidpoint into dependency-free ES module exports.
 * - Added coincident-node guards to prevent division by zero.
 * - Vue/D3 layout, backend, LLM calls, and social simulation are not included.
 */
export const getLinkPath = (d) => {
  const sx = d.source.x, sy = d.source.y
  const tx = d.target.x, ty = d.target.y
  
  // 检测自环
  if (d.isSelfLoop) {
    // 自环：绘制一个圆弧从节点出发再返回
    const loopRadius = 30
    // 从节点右侧出发，绕一圈回来
    const x1 = sx + 8  // 起点偏移
    const y1 = sy - 4
    const x2 = sx + 8  // 终点偏移
    const y2 = sy + 4
    // 使用圆弧绘制自环（sweep-flag=1 顺时针）
    return `M${x1},${y1} A${loopRadius},${loopRadius} 0 1,1 ${x2},${y2}`
  }
  
  if (d.curvature === 0) {
    // 直线
    return `M${sx},${sy} L${tx},${ty}`
  }
  
  // 计算曲线控制点 - 根据边数量和距离动态调整
  const dx = tx - sx, dy = ty - sy
  const dist = Math.sqrt(dx * dx + dy * dy)
  // CIBE: coincident nodes have no normal direction; avoid NaN SVG coordinates.
  if (dist === 0) return `M${sx},${sy} L${tx},${ty}`
  // 垂直于连线方向的偏移，根据距离比例计算，保证曲线明显可见
  // 边越多，偏移量占距离的比例越大
  const pairTotal = d.pairTotal || 1
  const offsetRatio = 0.25 + pairTotal * 0.05 // 基础25%，每多一条边增加5%
  const baseOffset = Math.max(35, dist * offsetRatio)
  const offsetX = -dy / dist * d.curvature * baseOffset
  const offsetY = dx / dist * d.curvature * baseOffset
  const cx = (sx + tx) / 2 + offsetX
  const cy = (sy + ty) / 2 + offsetY
  
  return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`
}

// 计算曲线中点（用于标签定位）
export const getLinkMidpoint = (d) => {
  const sx = d.source.x, sy = d.source.y
  const tx = d.target.x, ty = d.target.y
  
  // 检测自环
  if (d.isSelfLoop) {
    // 自环标签位置：节点右侧
    return { x: sx + 70, y: sy }
  }
  
  if (d.curvature === 0) {
    return { x: (sx + tx) / 2, y: (sy + ty) / 2 }
  }
  
  // 二次贝塞尔曲线的中点 t=0.5
  const dx = tx - sx, dy = ty - sy
  const dist = Math.sqrt(dx * dx + dy * dy)
  // CIBE: coincident nodes have no normal direction.
  if (dist === 0) return { x: sx, y: sy }
  const pairTotal = d.pairTotal || 1
  const offsetRatio = 0.25 + pairTotal * 0.05
  const baseOffset = Math.max(35, dist * offsetRatio)
  const offsetX = -dy / dist * d.curvature * baseOffset
  const offsetY = dx / dist * d.curvature * baseOffset
  const cx = (sx + tx) / 2 + offsetX
  const cy = (sy + ty) / 2 + offsetY
  
  // 二次贝塞尔曲线公式 B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2, t=0.5
  const midX = 0.25 * sx + 0.5 * cx + 0.25 * tx
  const midY = 0.25 * sy + 0.5 * cy + 0.25 * ty
  
  return { x: midX, y: midY }
}



import { motion, useReducedMotion } from 'motion/react'

/**
 * Fades a block up as it enters the viewport, once. Used where the page tells
 * the method in order, so each part arrives as it's read. Static under
 * reduced motion.
 */
export function Reveal({
  children,
  className,
  style,
  delay = 0,
  as = 'div',
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
  as?: 'div' | 'li'
}) {
  const reduce = useReducedMotion()
  const Tag = as === 'li' ? motion.li : motion.div

  return (
    <Tag
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  )
}

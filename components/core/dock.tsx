'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import React, { PropsWithChildren, useRef } from 'react'

import { cn } from '@/lib/utils'

export interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string
  magnification?: number
  distance?: number
  direction?: 'top' | 'middle' | 'bottom'
  children: React.ReactNode
}

const DEFAULT_MAGNIFICATION = 45
const DEFAULT_DISTANCE = 120

const dockVariants = cva(
  'mx-auto w-max h-[58px] p-2 flex items-end gap-2 rounded-2xl border supports-backdrop-blur:bg-white/20 supports-backdrop-blur:dark:bg-black/20 backdrop-blur-md',
)

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      magnification = DEFAULT_MAGNIFICATION,
      distance = DEFAULT_DISTANCE,
      direction = 'bottom',
      ...props
    },
    ref,
  ) => {
    const mouseX = useMotionValue(Infinity)

    const renderChildren = () => {
      return React.Children.map(children, (child: any) => {
        return React.cloneElement(child, {
          mouseX: mouseX,
          magnification: magnification,
          distance: distance,
        })
      })
    }

    return (
      <motion.div
        ref={ref}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        {...props}
        className={cn(dockVariants({ className }), {
          'items-start': direction === 'top',
          'items-center': direction === 'middle',
          'items-end': direction === 'bottom',
        })}
      >
        {renderChildren()}
      </motion.div>
    )
  },
)

Dock.displayName = 'Dock'

export interface DockIconProps {
  size?: number
  magnification?: number
  distance?: number
  mouseX?: any
  className?: string
  children?: React.ReactNode
  props?: PropsWithChildren
}

const DockIcon = ({
  size,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mouseX,
  className,
  children,
  ...props
}: DockIconProps) => {
  const ref = useRef<HTMLDivElement>(null)

  const distanceCalc = useTransform(mouseX || useMotionValue(Infinity), (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthSync = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [40, magnification, 40],
  )

  const width = useSpring(widthSync, {
    mass: 0.05,
    stiffness: 300,
    damping: 20,
  })

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className={cn(
        'flex aspect-square cursor-pointer items-center justify-center rounded-full',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

DockIcon.displayName = 'DockIcon'

const DockItem = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('relative', className)} {...props}>
      {children}
    </div>
  )
}
DockItem.displayName = 'DockItem'

const DockLabel = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
DockLabel.displayName = 'DockLabel'

export { Dock, DockIcon, DockItem, DockLabel, dockVariants }


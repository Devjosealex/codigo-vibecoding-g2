"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const cvs: HTMLCanvasElement = canvas
    const c: CanvasRenderingContext2D = ctx

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let animId = 0
    let mouseX = -1000
    let mouseY = -1000
    let w = 0
    let h = 0
    let particleColor = "37, 99, 235"

    function readColor() {
      particleColor =
        getComputedStyle(cvs)
          .getPropertyValue("--particle-color")
          .trim() || "37, 99, 235"
    }

    function resize() {
      w = cvs.clientWidth
      h = cvs.clientHeight
      cvs.width = w * 2
      cvs.height = h * 2
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.scale(2, 2)
    }

    resize()
    readColor()

    const density = reduceMotion ? 24000 : 12000
    const particleCount = Math.min(100, Math.floor((w * h) / density))
    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      })
    }

    function draw() {
      c.clearRect(0, 0, w, h)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150
          p.vx -= (dx / dist) * force * 0.02
          p.vy -= (dy / dist) * force * 0.02
        }

        p.vx += (Math.random() - 0.5) * 0.01
        p.vy += (Math.random() - 0.5) * 0.01
        p.vx *= 0.98
        p.vy *= 0.98
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        c.beginPath()
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        c.fillStyle = `rgba(${particleColor}, ${p.alpha})`
        c.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx2 = p.x - p2.x
          const dy2 = p.y - p2.y
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
          if (dist2 < 120) {
            c.beginPath()
            c.moveTo(p.x, p.y)
            c.lineTo(p2.x, p2.y)
            c.strokeStyle = `rgba(${particleColor}, ${0.06 * (1 - dist2 / 120)})`
            c.lineWidth = 0.5
            c.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    function onResize() {
      resize()
    }

    function onMouseMove(e: MouseEvent) {
      const rect = cvs.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }

    function onMouseLeave() {
      mouseX = -1000
      mouseY = -1000
    }

    function onThemeChange() {
      readColor()
    }

    const themeObserver = new MutationObserver(onThemeChange)
    themeObserver.observe(cvs.ownerDocument.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    if (!reduceMotion) {
      draw()
    } else {
      for (const p of particles) {
        c.beginPath()
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        c.fillStyle = `rgba(${particleColor}, ${p.alpha})`
        c.fill()
      }
    }

    window.addEventListener("resize", onResize)
    cvs.addEventListener("mousemove", onMouseMove)
    cvs.addEventListener("mouseleave", onMouseLeave)

    return () => {
      cancelAnimationFrame(animId)
      themeObserver.disconnect()
      window.removeEventListener("resize", onResize)
      cvs.removeEventListener("mousemove", onMouseMove)
      cvs.removeEventListener("mouseleave", onMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      aria-hidden="true"
    />
  )
}

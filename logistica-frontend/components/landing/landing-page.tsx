"use client"

import { useState, useRef, useCallback, memo } from "react"
import Link from "next/link"
import {
  LazyMotion,
  domAnimation,
  m,
  useMotionValue,
  useSpring,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion"
import { useTheme } from "next-themes"
import {
  Menu,
  X,
  ArrowRight,
  Check,
  MapPin,
  BarChart3,
  Route,
  AppWindow,
  Cpu,
  Star,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react"
import ParticleCanvas from "@/components/landing/particle-canvas"

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const wordsReveal: Variants = {
  hidden: { y: 60, opacity: 0, filter: "blur(8px)" },
  visible: { y: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 0.5 } },
}

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const fadeUpSection: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const cardIn: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const stepInLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5 } },
}

const stepInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5 } },
}

const scrollDot = {
  animate: { y: [0, 8, 0] },
  transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const },
}

const floatingBadgeAnim = {
  animate: { y: [0, -8, 0] },
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
}

const navIn = {
  initial: { y: -80, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" as const } },
}

const themeToggleAnim = {
  initial: { rotate: -90, opacity: 0, scale: 0.5 },
  animate: { rotate: 0, opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: "easeOut" as const },
}

const LOGOS = [
  { name: "Empresa A", tint: "bg-logo-tint-1" },
  { name: "Empresa B", tint: "bg-logo-tint-2" },
  { name: "Empresa C", tint: "bg-logo-tint-3" },
  { name: "Empresa D", tint: "bg-logo-tint-4" },
  { name: "Empresa E", tint: "bg-logo-tint-5" },
  { name: "Empresa F", tint: "bg-logo-tint-6" },
]

const FEATURES = [
  {
    icon: <MapPin size={24} />,
    title: "Tracking en tiempo real",
    description:
      "Monitorea tu flota y envíos con mapa interactivo. Geolocalización precisa con actualización cada 5 segundos.",
    featured: false,
  },
  {
    icon: <BarChart3 size={24} />,
    title: "Dashboard de operaciones",
    description:
      "KPIs, alertas inteligentes y reportes automáticos para tomar decisiones basadas en datos.",
    featured: false,
  },
  {
    icon: <Route size={24} />,
    title: "Rutas optimizadas con IA",
    description:
      "Reduce costos de combustible hasta un 25% con algoritmos de optimización de última milla.",
    featured: false,
  },
  {
    icon: <Cpu size={24} />,
    title: "Integración con ERP y SAP",
    description:
      "Conecta con tus sistemas existentes. Compatible con SAP, Oracle, Microsoft Dynamics y facturación electrónica SAT.",
    featured: true,
  },
  {
    icon: <AppWindow size={24} />,
    title: "App móvil para conductores",
    description:
      "Firma digital, evidencia fotográfica y navegación asistida desde el celular. Sin papel, sin errores.",
    featured: false,
  },
]

const STEPS = [
  {
    number: "01",
    title: "Registra tu empresa",
    description: "Crea tu cuenta en minutos. Sin contratos largos ni instalaciones complejas.",
  },
  {
    number: "02",
    title: "Configura tu flota",
    description: "Añade vehículos, conductores y zonas de operación con unos pocos clics.",
  },
  {
    number: "03",
    title: "Optimiza tus rutas",
    description:
      "Nuestro algoritmo IA calcula la ruta más eficiente considerando tráfico, distancia y prioridades.",
  },
  {
    number: "04",
    title: "Monitorea en tiempo real",
    description:
      "Sigue cada envío desde tu dashboard. Recibe alertas y genera reportes automáticos.",
  },
]

const TESTIMONIALS = [
  {
    quote:
      "Redujimos nuestros costos de transporte en un 30% durante el primer trimestre. La optimización de rutas con IA es increíble.",
    author: "María García",
    role: "Directora de Operaciones",
    company: "Grupo Logístico del Norte",
    rating: 5,
  },
  {
    quote:
      "La integración con SAP fue seamless. En dos semanas teníamos todo funcionando. El dashboard nos da visibilidad total.",
    author: "Carlos Mendoza",
    role: "Supply Chain Manager",
    company: "Distribuidora Nacional",
    rating: 5,
  },
  {
    quote:
      "La app para conductores eliminó por completo el papeleo. Ahora todo es digital con firma y fotos.",
    author: "Ana Rodríguez",
    role: "Gerente de Flota",
    company: "Transportes del Sur",
    rating: 5,
  },
  {
    quote:
      "El soporte técnico es excepcional. Implementaron tracking en tiempo real para toda nuestra flota en tiempo récord.",
    author: "Roberto Sánchez",
    role: "CEO",
    company: "LogiExpress",
    rating: 4,
  },
  {
    quote:
      "Pasamos de 3 sistemas separados a uno solo. La curva de aprendizaje es mínima y el ROI fue inmediato.",
    author: "Laura Jiménez",
    role: "VP de Logística",
    company: "Comercializadora del Pacífico",
    rating: 5,
  },
]

const SOCIALS = [
  {
    label: "Twitter",
    path: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z",
  },
  {
    label: "LinkedIn",
    path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  },
  {
    label: "YouTube",
    path: "M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z M9.75 15.02l5.75-3.14-5.75-3.14v6.28z",
  },
  {
    label: "GitHub",
    path: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22",
  },
]

const NAV_LINKS = ["Features", "Cómo funciona", "Testimonios", "Contacto"]

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Cambiar a modo ${isDark ? "claro" : "oscuro"}`}
      className="w-10 h-10 rounded-lg flex items-center justify-center text-master-text/70 hover:text-master-primary hover:bg-master-primary/10 transition-all duration-200 cursor-pointer"
    >
      <m.div
        key={isDark ? "sun" : "moon"}
        {...themeToggleAnim}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </m.div>
    </button>
  )
}

const MagneticButton = memo(function MagneticButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof m.button>) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 15 })
  const springY = useSpring(y, { stiffness: 200, damping: 15 })
  const prefersReducedMotion = useReducedMotion()

  const handleMouse = useCallback(
    (e: React.MouseEvent) => {
      if (prefersReducedMotion) return
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      x.set((e.clientX - cx) * 0.15)
      y.set((e.clientY - cy) * 0.15)
    },
    [prefersReducedMotion, x, y],
  )

  const handleLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return (
    <m.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
      className={className}
      {...props}
    >
      {children}
    </m.button>
  )
})

const TiltCard = memo(function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(y, { stiffness: 200, damping: 20 })
  const rotateY = useSpring(x, { stiffness: 200, damping: 20 })
  const prefersReducedMotion = useReducedMotion()

  const handleMouse = useCallback(
    (e: React.MouseEvent) => {
      if (prefersReducedMotion) return
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      x.set((px - 0.5) * 10)
      y.set((0.5 - py) * 10)
    },
    [prefersReducedMotion, x, y],
  )

  const handleLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return (
    <m.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </m.div>
  )
})

function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <m.header
      {...navIn}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl glass rounded-2xl px-8 py-5"
    >
      <nav className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-master-primary flex items-center justify-center">
            <span className="text-on-dark text-base font-bold">L</span>
          </div>
          <span className="font-heading-master text-2xl font-semibold text-master-text">
            Logistica
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href={`#${slugify(link)}`}
              className="text-base text-master-text/70 hover:text-master-primary transition-colors duration-200 cursor-pointer"
            >
              {link}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <MagneticButton className="bg-master-cta text-on-dark px-6 py-2.5 rounded-lg text-base font-semibold hover:opacity-90 transition-opacity cursor-pointer">
            Solicitar demo
          </MagneticButton>
        </div>

        <button
          className="md:hidden text-master-text cursor-pointer"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {open && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden pt-4 pb-2 flex flex-col gap-3"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href={`#${slugify(link)}`}
              className="text-sm text-master-text/70 hover:text-master-primary transition-colors cursor-pointer"
              onClick={() => setOpen(false)}
            >
              {link}
            </a>
          ))}
          <MagneticButton className="bg-master-cta text-on-dark px-5 py-2 rounded-lg text-sm font-semibold mt-2 cursor-pointer">
            Solicitar demo
          </MagneticButton>
        </m.div>
      )}
    </m.header>
  )
}

function Hero() {
  const headline = "Logística inteligente para empresas que no se detienen."
  const words = headline.split(" ")

  return (
    <section className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-master-background">
      <ParticleCanvas />

      <div className="absolute inset-0 bg-noise pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 bg-grid pointer-events-none" aria-hidden="true" />

      <div
        className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-master-primary/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full bg-master-cta/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <FloatingBadge className="absolute top-32 left-[10%] hidden lg:flex" icon={<MapPin size={14} />} label="Tracking en vivo" />
      <FloatingBadge className="absolute top-40 right-[12%] hidden lg:flex" icon={<BarChart3 size={14} />} label="KPIs en tiempo real" />
      <FloatingBadge className="absolute bottom-48 left-[15%] hidden lg:flex" icon={<Route size={14} />} label="Rutas optimizadas" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <m.p
          {...fadeIn}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-master-primary font-semibold text-sm tracking-wide uppercase mb-6"
        >
          Mueve más, gestiona menos
        </m.p>

        <m.h1
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="font-heading-master text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-master-text"
        >
          {words.map((word, i) => (
            <m.span key={i} variants={wordsReveal} className="inline-block mr-[0.3em]">
              {word}
            </m.span>
          ))}
        </m.h1>

        <m.p
          {...fadeIn}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 text-lg sm:text-xl text-master-text/60 max-w-2xl mx-auto font-body-master"
        >
          Optimiza tus operaciones logísticas con nuestra plataforma todo-en-uno.
          Tracking, rutas inteligentes y dashboard de control en un solo lugar.
        </m.p>

        <m.div
          {...fadeIn}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <MagneticButton className="bg-master-cta text-on-dark px-8 py-3.5 rounded-xl text-base font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 shadow-lg shadow-master-cta/20">
            Solicitar demo gratuita
            <ArrowRight size={18} />
          </MagneticButton>
          <MagneticButton className="bg-transparent text-master-primary border-2 border-master-primary px-8 py-3 rounded-xl text-base font-semibold hover:bg-master-primary/5 transition-colors cursor-pointer">
            Ver plataforma
          </MagneticButton>
        </m.div>

        <m.div
          {...fadeIn}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-12 flex items-center justify-center gap-4 flex-wrap"
        >
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full border-2 border-master-surface bg-gradient-to-br from-master-primary to-master-secondary flex items-center justify-center text-on-dark text-xs font-bold"
              >
                {String.fromCharCode(64 + i)}
              </div>
            ))}
            <div className="w-9 h-9 rounded-full border-2 border-master-surface bg-master-cta flex items-center justify-center text-on-dark text-xs font-bold">
              +200
            </div>
          </div>
          <p className="text-sm text-master-text/60 font-body-master">
            Más de <span className="font-semibold text-master-text">200 empresas</span> confían en nosotros
          </p>
        </m.div>
      </div>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-master-background to-transparent" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-6 h-10 rounded-full border-2 border-master-text/20 flex justify-center">
          <m.div
            {...scrollDot}
            className="w-1.5 h-1.5 rounded-full bg-master-primary mt-2"
          />
        </div>
      </div>
    </section>
  )
}

function FloatingBadge({
  className,
  icon,
  label,
}: {
  className?: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <m.div
      {...floatingBadgeAnim}
      className={`glass rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-medium text-master-text/80 z-10 ${className ?? ""}`}
    >
      <span className="text-master-primary">{icon}</span>
      {label}
    </m.div>
  )
}

function LogosBar() {
  const items = [...LOGOS, ...LOGOS]
  return (
    <section className="py-16 bg-master-surface border-y border-master-text/5">
      <p className="text-center text-xs text-master-text/40 font-semibold tracking-wider uppercase mb-8 font-body-master">
        Empresas que ya optimizan su logística
      </p>
      <div className="overflow-hidden">
        <div className="flex animate-marquee gap-16 items-center">
          {items.map((logo, i) => (
            <div
              key={i}
              className={`w-24 h-10 ${logo.tint} rounded-lg opacity-30 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-master-text/50`}
            >
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" ref={ref} className="py-24 bg-master-background">
      <div className="max-w-6xl mx-auto px-4">
        <m.div
          {...fadeUpSection}
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <p className="text-master-primary font-semibold text-sm tracking-wide uppercase mb-3 font-body-master">
            Funcionalidades
          </p>
          <h2 className="font-heading-master text-3xl sm:text-4xl font-bold text-master-text">
            Todo lo que necesitas para gestionar tu logística
          </h2>
          <p className="mt-4 text-master-text/60 max-w-xl mx-auto font-body-master">
            Una plataforma completa que simplifica cada aspecto de tu cadena de suministro.
          </p>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <m.div
              key={feature.title}
              variants={cardIn}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              transition={{ delay: 0.1 * i }}
              className={`glass rounded-2xl p-8 transition-all duration-200 hover:shadow-lg hover:shadow-master-primary/5 group ${
                feature.featured ? "md:col-span-2" : ""
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-master-primary/10 flex items-center justify-center text-master-primary mb-5 group-hover:scale-110 transition-transform duration-200">
                {feature.icon}
              </div>
              <h3 className="font-heading-master text-lg font-semibold text-master-text mb-3">
                {feature.title}
              </h3>
              <p className="text-master-text/60 text-sm leading-relaxed font-body-master">
                {feature.description}
              </p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="como-funciona" ref={ref} className="py-24 bg-master-surface">
      <div className="max-w-4xl mx-auto px-4">
        <m.div
          {...fadeUpSection}
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <p className="text-master-primary font-semibold text-sm tracking-wide uppercase mb-3 font-body-master">
            Cómo funciona
          </p>
          <h2 className="font-heading-master text-3xl sm:text-4xl font-bold text-master-text">
            Comienza en 4 pasos simples
          </h2>
        </m.div>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-master-primary/10 hidden md:block" />

          {STEPS.map((step, i) => {
            const isReversed = i % 2 === 1
            const anim = isReversed ? stepInRight : stepInLeft
            return (
              <m.div
                key={step.number}
                {...anim}
                transition={{ delay: 0.15 * i, duration: 0.5 }}
                className={`relative flex flex-col md:flex-row items-start gap-6 pb-16 last:pb-0 ${
                  isReversed ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="hidden md:flex w-16 shrink-0 justify-center">
                  <div className="w-8 h-8 rounded-full bg-master-primary text-on-dark flex items-center justify-center text-sm font-bold shadow-md shadow-master-primary/20">
                    {step.number}
                  </div>
                </div>

                <div className="md:hidden flex items-center gap-4 mb-2">
                  <div className="w-8 h-8 rounded-full bg-master-primary text-on-dark flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </div>
                  <h3 className="font-heading-master text-xl font-semibold text-master-text">{step.title}</h3>
                </div>

                <div className="glass rounded-2xl p-6 flex-1">
                  <h3 className="hidden md:block font-heading-master text-xl font-semibold text-master-text mb-2">
                    {step.title}
                  </h3>
                  <p className="text-master-text/60 text-sm font-body-master">{step.description}</p>
                </div>
              </m.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="testimonios" ref={ref} className="py-24 bg-master-background">
      <div className="max-w-6xl mx-auto px-4">
        <m.div
          {...fadeUpSection}
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <p className="text-master-primary font-semibold text-sm tracking-wide uppercase mb-3 font-body-master">
            Testimonios
          </p>
          <h2 className="font-heading-master text-3xl sm:text-4xl font-bold text-master-text">
            Lo que dicen nuestros clientes
          </h2>
        </m.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {TESTIMONIALS.map((t, i) => (
            <m.div
              key={t.author}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="break-inside-avoid"
            >
              <TiltCard className="glass rounded-2xl p-6 transition-shadow duration-200 hover:shadow-lg hover:shadow-master-primary/5">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      className={j < t.rating ? "text-master-cta fill-master-cta" : "text-master-text/10"}
                    />
                  ))}
                </div>
                <p className="text-master-text/80 text-sm leading-relaxed mb-5 font-body-master italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-heading-master font-semibold text-sm text-master-text">{t.author}</p>
                  <p className="text-xs text-master-text/50 font-body-master">{t.role}, {t.company}</p>
                </div>
              </TiltCard>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-24 bg-master-background">
      <div className="max-w-4xl mx-auto px-4">
        <m.div
          {...fadeUpSection}
          animate={inView ? "visible" : "hidden"}
          className="relative"
        >
          <div className="gradient-border-wrap rounded-3xl">
            <div className="glass-strong rounded-3xl p-8 sm:p-12 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-noise pointer-events-none opacity-50" aria-hidden="true" />
              <div
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-master-primary/10 blur-3xl pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-master-cta/10 blur-3xl pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative z-10">
                <h2 className="font-heading-master text-3xl sm:text-4xl font-bold text-master-text mb-4">
                  Comienza hoy mismo
                </h2>
                <p className="text-master-text/60 max-w-lg mx-auto mb-8 font-body-master">
                  Solicita una demo gratuita y descubre cómo podemos transformar tu operación logística.
                </p>

                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
                >
                  <input
                    type="email"
                    placeholder="tu@empresa.com"
                    required
                    className="w-full px-5 py-3.5 rounded-xl bg-input-bg border border-master-text/10 text-master-text placeholder:text-master-text/30 text-sm focus:outline-none focus:border-master-primary focus:ring-2 focus:ring-master-primary/20 transition-all font-body-master"
                  />
                  <MagneticButton
                    type="submit"
                    className="bg-master-cta text-on-dark px-6 py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap flex items-center gap-2 shadow-lg shadow-master-cta/20"
                  >
                    Solicitar demo
                    <ChevronRight size={16} />
                  </MagneticButton>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-master-text/40 font-body-master">
                  <span className="flex items-center gap-2">
                    <Check size={14} className="text-master-cta" />
                    Sin compromiso
                  </span>
                  <span className="mx-2">•</span>
                  <span className="flex items-center gap-2">
                    <Check size={14} className="text-master-cta" />
                    Demo personalizada
                  </span>
                  <span className="mx-2">•</span>
                  <span className="flex items-center gap-2">
                    <Check size={14} className="text-master-cta" />
                    Soporte incluido
                  </span>
                </div>
              </div>
            </div>
          </div>
        </m.div>
      </div>
    </section>
  )
}

function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-master-footer text-on-dark pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-overlay-soft flex items-center justify-center">
                <span className="text-on-dark text-sm font-bold">L</span>
              </div>
              <span className="font-heading-master text-lg font-semibold">Logistica</span>
            </Link>
            <p className="text-on-dark-muted text-sm leading-relaxed font-body-master">
              Plataforma de logística inteligente para empresas que buscan eficiencia operativa y visibilidad total de su cadena de suministro.
            </p>
          </div>

          <FooterColumn title="Producto" items={["Tracking", "Dashboard", "Rutas IA", "Integraciones", "App Móvil"]} />
          <FooterColumn title="Compañía" items={["Sobre nosotros", "Blog", "Casos de éxito", "Precios", "Contacto"]} />
          <FooterColumn
            title="Soporte"
            items={["Centro de ayuda", "Documentación API", "Estado del sistema", "Privacidad", "Términos"]}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-on-dark-faint gap-4">
          <p className="text-on-dark-faint text-xs font-body-master">
            &copy; {year} Logistica Web. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href="#"
                aria-label={social.label}
                className="w-8 h-8 rounded-lg bg-overlay-faint flex items-center justify-center text-on-dark-subtle hover:bg-master-primary hover:text-on-dark transition-all duration-200 cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-heading-master font-semibold text-sm mb-4">{title}</h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item}>
            <a
              href="#"
              className="text-on-dark-muted text-sm hover:text-on-dark transition-colors duration-200 cursor-pointer font-body-master"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function LandingPage() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="bg-master-background text-master-text font-body-master">
        <Nav />
        <Hero />
        <LogosBar />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTASection />
        <Footer />
      </div>
    </LazyMotion>
  )
}

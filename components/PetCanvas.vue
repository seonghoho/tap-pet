<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PetAction, PetSpecies, PetStatus } from '~/types/pet'

const props = withDefaults(defineProps<{
  species: PetSpecies
  status: PetStatus
  activeReaction?: PetAction | null
  label: string
}>(), {
  activeReaction: null,
})

type Point = { x: number; y: number }

const canvas = ref<HTMLCanvasElement | null>(null)

let context: CanvasRenderingContext2D | null = null
let frameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let width = 0
let height = 0
let pixelRatio = 1
let startedAt = 0
let isReducedMotion = false
let isVisible = true

onMounted(() => {
  const element = canvas.value
  if (!element) return

  context = element.getContext('2d')
  if (!context) return

  startedAt = performance.now()
  isVisible = document.visibilityState !== 'hidden'
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  isReducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionPreference)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(element)
  resizeCanvas()
  startAnimation()
})

onBeforeUnmount(() => {
  stopAnimation()
  resizeObserver?.disconnect()
  resizeObserver = null
  motionQuery?.removeEventListener('change', handleMotionPreference)
  motionQuery = null
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  context = null
})

watch(
  () => [props.species, props.status, props.activeReaction],
  () => {
    startedAt = performance.now()
    if (isReducedMotion) drawFrame(startedAt)
  },
)

function handleMotionPreference(event: MediaQueryListEvent): void {
  isReducedMotion = event.matches
  startAnimation()
}

function handleVisibilityChange(): void {
  isVisible = document.visibilityState !== 'hidden'
  startAnimation()
}

function resizeCanvas(): void {
  const element = canvas.value
  if (!element || !context) return

  const bounds = element.getBoundingClientRect()
  const nextWidth = Math.max(1, Math.round(bounds.width))
  const nextHeight = Math.max(1, Math.round(bounds.height))
  const nextPixelRatio = Math.min(window.devicePixelRatio || 1, 2)

  if (nextWidth === width && nextHeight === height && nextPixelRatio === pixelRatio) return

  width = nextWidth
  height = nextHeight
  pixelRatio = nextPixelRatio
  element.width = Math.round(width * pixelRatio)
  element.height = Math.round(height * pixelRatio)
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  drawFrame(performance.now())
}

function startAnimation(): void {
  stopAnimation()
  if (!context || width === 0 || height === 0) return

  if (isReducedMotion || !isVisible) {
    drawFrame(performance.now())
    return
  }

  frameId = requestAnimationFrame(animate)
}

function stopAnimation(): void {
  if (frameId === null) return
  cancelAnimationFrame(frameId)
  frameId = null
}

function animate(timestamp: number): void {
  drawFrame(timestamp)
  frameId = requestAnimationFrame(animate)
}

function drawFrame(timestamp: number): void {
  if (!context || width === 0 || height === 0) return

  const elapsed = isReducedMotion ? 0 : (timestamp - startedAt) / 1000
  context.save()
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)
  drawRoom(context, elapsed)
  drawPet(context, elapsed)
  drawReaction(context, elapsed)
  context.restore()
}

function drawRoom(ctx: CanvasRenderingContext2D, elapsed: number): void {
  const night = props.status === 'sleepy'
  const unsettled = props.status === 'bored' || props.status === 'hungry' || props.status === 'dirty'
  const top = night ? '#243d4d' : unsettled ? '#e8d7c5' : '#dce5d9'
  const bottom = night ? '#9e7181' : unsettled ? '#e6b88d' : '#f3c996'
  const background = ctx.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, top)
  background.addColorStop(1, bottom)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  const glowX = width * (0.7 + Math.sin(elapsed * 0.08) * 0.02)
  const glowY = height * 0.18
  const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, width * 0.32)
  glow.addColorStop(0, night ? 'rgba(255, 231, 177, .72)' : 'rgba(255, 250, 223, .92)')
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height * 0.7)

  drawWindow(ctx, elapsed, night)
  drawShelf(ctx)
  drawPlant(ctx, elapsed)

  const floorTop = height * 0.67
  const floor = ctx.createLinearGradient(0, floorTop, 0, height)
  floor.addColorStop(0, night ? '#705868' : '#d5a879')
  floor.addColorStop(1, night ? '#443c4c' : '#b77b52')
  ctx.fillStyle = floor
  ctx.beginPath()
  ctx.moveTo(0, floorTop)
  ctx.lineTo(width, floorTop - height * 0.025)
  ctx.lineTo(width, height)
  ctx.lineTo(0, height)
  ctx.closePath()
  ctx.fill()

  const rug = ctx.createRadialGradient(width * 0.52, height * 0.82, 0, width * 0.52, height * 0.82, width * 0.34)
  rug.addColorStop(0, night ? '#568f8d' : '#f4e1bb')
  rug.addColorStop(0.72, night ? '#397474' : '#e6c486')
  rug.addColorStop(1, night ? 'rgba(27, 78, 79, 0)' : 'rgba(197, 137, 71, 0)')
  ctx.fillStyle = rug
  ctx.beginPath()
  ctx.ellipse(width * 0.52, height * 0.83, width * 0.34, height * 0.15, -0.03, 0, Math.PI * 2)
  ctx.fill()

  drawDust(ctx, elapsed, night)
}

function drawWindow(ctx: CanvasRenderingContext2D, elapsed: number, night: boolean): void {
  const windowWidth = Math.min(width * 0.25, 230)
  const windowHeight = Math.min(height * 0.3, 210)
  const x = width * 0.09
  const y = height * 0.1

  ctx.save()
  ctx.shadowColor = 'rgba(54, 40, 31, .18)'
  ctx.shadowBlur = 28
  roundRect(ctx, x, y, windowWidth, windowHeight, 28)
  ctx.fillStyle = night ? '#183849' : '#a9d5d3'
  ctx.fill()
  ctx.shadowBlur = 0

  const sky = ctx.createLinearGradient(x, y, x, y + windowHeight)
  sky.addColorStop(0, night ? '#183649' : '#8ecbd1')
  sky.addColorStop(1, night ? '#74586e' : '#f7d7a8')
  ctx.fillStyle = sky
  roundRect(ctx, x + 10, y + 10, windowWidth - 20, windowHeight - 20, 21)
  ctx.fill()

  ctx.fillStyle = night ? '#f8dfa8' : '#fff6cf'
  ctx.beginPath()
  ctx.arc(x + windowWidth * 0.72, y + windowHeight * 0.27, windowWidth * 0.09, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 251, 235, .55)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(x + windowWidth / 2, y + 10)
  ctx.lineTo(x + windowWidth / 2, y + windowHeight - 10)
  ctx.moveTo(x + 10, y + windowHeight * 0.58)
  ctx.lineTo(x + windowWidth - 10, y + windowHeight * 0.58)
  ctx.stroke()

  if (!night) {
    ctx.fillStyle = 'rgba(255,255,255,.72)'
    const cloudShift = Math.sin(elapsed * 0.14) * 5
    ctx.beginPath()
    ctx.ellipse(x + windowWidth * 0.31 + cloudShift, y + windowHeight * 0.31, 20, 8, 0, 0, Math.PI * 2)
    ctx.ellipse(x + windowWidth * 0.39 + cloudShift, y + windowHeight * 0.28, 15, 11, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawShelf(ctx: CanvasRenderingContext2D): void {
  if (width < 620) return

  const x = width * 0.72
  const y = height * 0.24
  ctx.fillStyle = 'rgba(83, 59, 43, .7)'
  roundRect(ctx, x, y, width * 0.2, 9, 5)
  ctx.fill()

  const colors = ['#e38f64', '#718b7c', '#f2d08f']
  colors.forEach((color, index) => {
    ctx.fillStyle = color
    roundRect(ctx, x + 18 + index * 35, y - 38 - index * 4, 24, 38 + index * 4, 5)
    ctx.fill()
  })
}

function drawPlant(ctx: CanvasRenderingContext2D, elapsed: number): void {
  if (width < 540) return

  const x = width * 0.87
  const y = height * 0.67
  ctx.save()
  ctx.fillStyle = 'rgba(98, 70, 49, .7)'
  roundRect(ctx, x - 34, y - 43, 68, 48, 12)
  ctx.fill()
  ctx.translate(x, y - 44)
  ctx.rotate(Math.sin(elapsed * 0.4) * 0.015)
  ctx.fillStyle = '#5d755d'
  for (let index = 0; index < 5; index += 1) {
    const angle = -1.25 + index * 0.62
    ctx.save()
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.ellipse(0, -33, 15, 38, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()
}

function drawDust(ctx: CanvasRenderingContext2D, elapsed: number, night: boolean): void {
  const particles = [
    { x: 0.38, y: 0.18, size: 2.5, speed: 0.7 },
    { x: 0.56, y: 0.3, size: 2, speed: 0.52 },
    { x: 0.68, y: 0.13, size: 3, speed: 0.4 },
    { x: 0.44, y: 0.48, size: 1.7, speed: 0.82 },
    { x: 0.78, y: 0.43, size: 2.3, speed: 0.62 },
  ]

  ctx.fillStyle = night ? 'rgba(255, 231, 177, .68)' : 'rgba(255, 250, 228, .75)'
  for (const particle of particles) {
    const offset = Math.sin(elapsed * particle.speed + particle.x * 8) * 9
    ctx.beginPath()
    ctx.arc(width * particle.x + offset, height * particle.y, particle.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPet(ctx: CanvasRenderingContext2D, elapsed: number): void {
  const compact = width < 560
  const petScale = Math.min(width / (compact ? 510 : 760), height / 660) * (compact ? 1.28 : 1.5)
  const actionElapsed = Math.max(0, elapsed)
  let bob = Math.sin(elapsed * 1.5) * 3
  let rotation = Math.sin(elapsed * 0.7) * 0.012
  let squashX = 1
  let squashY = 1

  if (props.status === 'sleepy') bob *= 0.3
  if (props.activeReaction === 'feed') {
    rotation += Math.sin(actionElapsed * 8) * 0.035
    squashY = 0.98 + Math.sin(actionElapsed * 8) * 0.025
  }
  if (props.activeReaction === 'play') {
    bob -= Math.abs(Math.sin(actionElapsed * 4.6)) * 32
    rotation += Math.sin(actionElapsed * 4.6) * 0.06
  }
  if (props.activeReaction === 'sleep') {
    squashX = 1.08
    squashY = 0.91 + Math.sin(actionElapsed * 1.8) * 0.015
    bob += 12
  }
  if (props.activeReaction === 'wash') rotation += Math.sin(actionElapsed * 18) * 0.025

  const origin: Point = {
    x: width * (compact ? 0.5 : 0.52),
    y: height * (compact ? 0.66 : 0.68) + bob,
  }

  ctx.save()
  ctx.translate(origin.x, origin.y + 132 * petScale)
  ctx.scale(petScale, petScale * 0.33)
  const shadow = ctx.createRadialGradient(0, 0, 12, 0, 0, 105)
  shadow.addColorStop(0, 'rgba(55, 35, 23, .28)')
  shadow.addColorStop(1, 'rgba(55, 35, 23, 0)')
  ctx.fillStyle = shadow
  ctx.beginPath()
  ctx.arc(0, 0, 110, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(origin.x, origin.y)
  ctx.rotate(rotation)
  ctx.scale(petScale * squashX, petScale * squashY)

  if (props.status === 'excited') drawAura(ctx, elapsed)

  switch (props.species) {
    case 'cat':
      drawCat(ctx, elapsed)
      break
    case 'dog':
      drawDog(ctx, elapsed)
      break
    case 'hedgehog':
      drawHedgehog(ctx, elapsed)
      break
    case 'rabbit':
      drawRabbit(ctx, elapsed)
      break
    case 'penguin':
      drawPenguin(ctx, elapsed)
      break
    case 'hamster':
      drawHamster(ctx, elapsed)
      break
  }

  ctx.restore()
}

function drawCat(ctx: CanvasRenderingContext2D, elapsed: number): void {
  const body = '#c98255'
  const light = '#eeb681'
  drawTail(ctx, body, elapsed, 95, -5)
  drawRoundedBody(ctx, body)
  drawTriangleEar(ctx, -52, -91, -28, -145, -4, -91, body, '#ef9a94')
  drawTriangleEar(ctx, 12, -91, 38, -145, 60, -88, body, '#ef9a94')
  drawHead(ctx, body, light)
  drawFace(ctx, { eyeY: -71, muzzleY: -41, cheekColor: '#df7f77' })
}

function drawDog(ctx: CanvasRenderingContext2D, elapsed: number): void {
  const body = '#bd7650'
  const light = '#e9ad76'
  drawTail(ctx, body, elapsed * 1.8, 88, 9)
  drawRoundedBody(ctx, body)
  ctx.fillStyle = '#85503d'
  drawFloppyEar(ctx, -66, -108, -45)
  drawFloppyEar(ctx, 66, -108, 45)
  drawHead(ctx, body, light)
  drawFace(ctx, { eyeY: -68, muzzleY: -39, cheekColor: '#d87970', dogMuzzle: true })
}

function drawHedgehog(ctx: CanvasRenderingContext2D, elapsed: number): void {
  const points = 18
  ctx.fillStyle = '#65483c'
  ctx.beginPath()
  for (let index = 0; index < points * 2; index += 1) {
    const angle = -Math.PI + (Math.PI * 2 * index) / (points * 2)
    const radius = index % 2 === 0 ? 101 : 82
    const x = Math.cos(angle) * radius
    const y = -45 + Math.sin(angle) * radius * 0.92
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  drawRoundedBody(ctx, '#a66b4b')
  drawHead(ctx, '#d89c68', '#f0c38b')
  drawFace(ctx, { eyeY: -66, muzzleY: -38, cheekColor: '#dc7c74' })
}

function drawRabbit(ctx: CanvasRenderingContext2D, elapsed: number): void {
  const body = '#d9a679'
  const light = '#f0ceb0'
  drawRabbitEar(ctx, -37, -112, -10 + Math.sin(elapsed * 0.5) * 2, body)
  drawRabbitEar(ctx, 37, -112, 10 - Math.sin(elapsed * 0.5) * 2, body)
  drawRoundedBody(ctx, body)
  drawHead(ctx, body, light)
  drawFace(ctx, { eyeY: -67, muzzleY: -37, cheekColor: '#e58d87' })
}

function drawPenguin(ctx: CanvasRenderingContext2D, elapsed: number): void {
  ctx.save()
  ctx.fillStyle = '#293c43'
  ctx.translate(-74, -15)
  ctx.rotate(-0.22 + Math.sin(elapsed * 1.2) * 0.035)
  ctx.beginPath()
  ctx.ellipse(0, 0, 27, 68, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.fillStyle = '#293c43'
  ctx.translate(74, -15)
  ctx.rotate(0.22 - Math.sin(elapsed * 1.2) * 0.035)
  ctx.beginPath()
  ctx.ellipse(0, 0, 27, 68, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  drawRoundedBody(ctx, '#293c43')
  ctx.fillStyle = '#f4e9d5'
  ctx.beginPath()
  ctx.ellipse(0, 10, 53, 68, 0, 0, Math.PI * 2)
  ctx.fill()
  drawHead(ctx, '#293c43', '#f4e9d5')
  ctx.fillStyle = '#e69250'
  ctx.beginPath()
  ctx.moveTo(-11, -43)
  ctx.lineTo(0, -30)
  ctx.lineTo(11, -43)
  ctx.closePath()
  ctx.fill()
  drawFace(ctx, { eyeY: -67, muzzleY: -37, cheekColor: '#d97972', hideNose: true })
}

function drawHamster(ctx: CanvasRenderingContext2D, elapsed: number): void {
  const body = '#c88450'
  const light = '#f2c692'
  drawRoundedBody(ctx, body)
  drawRoundEar(ctx, -48, -105, body)
  drawRoundEar(ctx, 48, -105, body)
  drawHead(ctx, body, light)
  ctx.fillStyle = '#f4d9b6'
  ctx.beginPath()
  ctx.ellipse(-48, -42, 31, 28, 0, 0, Math.PI * 2)
  ctx.ellipse(48, -42, 31, 28, 0, 0, Math.PI * 2)
  ctx.fill()
  drawFace(ctx, { eyeY: -68, muzzleY: -38, cheekColor: '#e68a82' })
}

function drawRoundedBody(ctx: CanvasRenderingContext2D, color: string): void {
  const gradient = ctx.createLinearGradient(-70, -30, 75, 95)
  gradient.addColorStop(0, lighten(color, 18))
  gradient.addColorStop(1, color)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.ellipse(0, 38, 78, 96, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = lighten(color, 10)
  ctx.beginPath()
  ctx.ellipse(-42, 105, 35, 20, -0.1, 0, Math.PI * 2)
  ctx.ellipse(42, 105, 35, 20, 0.1, 0, Math.PI * 2)
  ctx.fill()
}

function drawHead(ctx: CanvasRenderingContext2D, color: string, light: string): void {
  const gradient = ctx.createLinearGradient(-65, -125, 70, -20)
  gradient.addColorStop(0, light)
  gradient.addColorStop(1, color)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.ellipse(0, -65, 76, 70, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255, 244, 221, .3)'
  ctx.beginPath()
  ctx.ellipse(-24, -91, 25, 14, -0.55, 0, Math.PI * 2)
  ctx.fill()
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  options: {
    eyeY: number
    muzzleY: number
    cheekColor: string
    dogMuzzle?: boolean
    hideNose?: boolean
  },
): void {
  const blink = isReducedMotion ? 0 : Math.pow(Math.max(0, Math.sin((performance.now() - startedAt) / 1150)), 22)
  const eyeHeight = Math.max(2, 15 * (1 - blink))
  const sleepy = props.status === 'sleepy' || props.activeReaction === 'sleep'
  const sad = props.status === 'bored'
  const excited = props.status === 'excited'

  ctx.save()
  ctx.strokeStyle = '#3a2b23'
  ctx.fillStyle = '#3a2b23'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'

  if (sleepy) {
    ctx.beginPath()
    ctx.arc(-29, options.eyeY, 10, 0.12, Math.PI - 0.12)
    ctx.arc(29, options.eyeY, 10, 0.12, Math.PI - 0.12)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.ellipse(-29, options.eyeY, excited ? 8 : 6.5, excited ? 18 : eyeHeight, sad ? -0.15 : 0, 0, Math.PI * 2)
    ctx.ellipse(29, options.eyeY, excited ? 8 : 6.5, excited ? 18 : eyeHeight, sad ? 0.15 : 0, 0, Math.PI * 2)
    ctx.fill()
    if (eyeHeight > 5) {
      ctx.fillStyle = 'rgba(255,255,255,.9)'
      ctx.beginPath()
      ctx.arc(-27, options.eyeY - 5, 2.2, 0, Math.PI * 2)
      ctx.arc(31, options.eyeY - 5, 2.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#3a2b23'
    }
  }

  if (options.dogMuzzle) {
    ctx.fillStyle = '#edc294'
    ctx.beginPath()
    ctx.ellipse(0, options.muzzleY, 27, 21, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  if (!options.hideNose) {
    ctx.fillStyle = '#8f4f50'
    ctx.beginPath()
    ctx.moveTo(-7, options.muzzleY - 7)
    ctx.quadraticCurveTo(0, options.muzzleY - 12, 7, options.muzzleY - 7)
    ctx.quadraticCurveTo(0, options.muzzleY + 2, -7, options.muzzleY - 7)
    ctx.fill()
  }

  ctx.strokeStyle = '#5a3930'
  ctx.lineWidth = 3
  ctx.beginPath()
  if (props.status === 'hungry') {
    ctx.arc(0, options.muzzleY + 12, 7, 0, Math.PI * 2)
  } else if (sad) {
    ctx.arc(0, options.muzzleY + 18, 10, Math.PI + 0.2, Math.PI * 2 - 0.2)
  } else if (!sleepy) {
    ctx.arc(0, options.muzzleY + 2, excited ? 14 : 9, 0.15, Math.PI - 0.15)
  }
  ctx.stroke()

  ctx.fillStyle = options.cheekColor
  ctx.globalAlpha = props.status === 'excited' ? 0.72 : 0.42
  ctx.beginPath()
  ctx.ellipse(-51, options.muzzleY + 2, 12, 7, 0, 0, Math.PI * 2)
  ctx.ellipse(51, options.muzzleY + 2, 12, 7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  if (props.status === 'dirty') {
    ctx.strokeStyle = 'rgba(91, 67, 48, .6)'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(44, options.eyeY - 26)
    ctx.lineTo(58, options.eyeY - 17)
    ctx.moveTo(47, options.eyeY - 15)
    ctx.lineTo(60, options.eyeY - 8)
    ctx.stroke()
  }
  ctx.restore()
}

function drawReaction(ctx: CanvasRenderingContext2D, elapsed: number): void {
  const reaction = props.activeReaction
  if (!reaction) return

  const x = width * (width < 560 ? 0.5 : 0.52)
  const y = height * (width < 560 ? 0.52 : 0.5)
  const pulse = Math.sin(elapsed * 4) * 4
  ctx.save()
  ctx.translate(x, y)

  if (reaction === 'feed') {
    ctx.fillStyle = '#f2a15f'
    for (let index = 0; index < 3; index += 1) {
      const angle = elapsed * 1.8 + index * 2.1
      const px = Math.cos(angle) * (115 + pulse)
      const py = -45 + Math.sin(angle) * 36
      roundRect(ctx, px - 9, py - 7, 18, 14, 6)
      ctx.fill()
    }
  }

  if (reaction === 'play') {
    const ballX = Math.sin(elapsed * 3.2) * 145
    const ballY = 126 - Math.abs(Math.cos(elapsed * 3.2)) * 42
    const ball = ctx.createRadialGradient(ballX - 5, ballY - 7, 2, ballX, ballY, 20)
    ball.addColorStop(0, '#ffcf87')
    ball.addColorStop(1, '#e56f62')
    ctx.fillStyle = ball
    ctx.beginPath()
    ctx.arc(ballX, ballY, 20, 0, Math.PI * 2)
    ctx.fill()
  }

  if (reaction === 'sleep') {
    ctx.fillStyle = 'rgba(255,255,255,.78)'
    ctx.font = '700 28px ui-rounded, system-ui, sans-serif'
    ctx.fillText('z', 84 + pulse, -105)
    ctx.font = '700 19px ui-rounded, system-ui, sans-serif'
    ctx.fillText('z', 116 - pulse, -142)
  }

  if (reaction === 'wash') {
    ctx.strokeStyle = 'rgba(230, 250, 246, .86)'
    ctx.lineWidth = 3
    for (let index = 0; index < 7; index += 1) {
      const angle = elapsed * (0.45 + index * 0.03) + index
      const radius = 80 + index * 9
      ctx.beginPath()
      ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius - 18, 7 + index, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawAura(ctx: CanvasRenderingContext2D, elapsed: number): void {
  ctx.save()
  ctx.fillStyle = 'rgba(255, 248, 200, .78)'
  for (let index = 0; index < 6; index += 1) {
    const angle = elapsed * 0.35 + (Math.PI * 2 * index) / 6
    const radius = 112 + Math.sin(elapsed * 2 + index) * 6
    const x = Math.cos(angle) * radius
    const y = -38 + Math.sin(angle) * radius
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(0, -8)
    ctx.lineTo(3, -2)
    ctx.lineTo(9, 0)
    ctx.lineTo(3, 2)
    ctx.lineTo(0, 8)
    ctx.lineTo(-3, 2)
    ctx.lineTo(-9, 0)
    ctx.lineTo(-3, -2)
    ctx.closePath()
    ctx.fill()
    ctx.rotate(-angle)
    ctx.translate(-x, -y)
  }
  ctx.restore()
}

function drawTail(ctx: CanvasRenderingContext2D, color: string, elapsed: number, x: number, y: number): void {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 24
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - 12, y + 52)
  ctx.quadraticCurveTo(x + 42, y + 20 + Math.sin(elapsed * 1.6) * 12, x + 30, y - 30)
  ctx.stroke()
  ctx.restore()
}

function drawTriangleEar(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  outer: string,
  inner: string,
): void {
  ctx.fillStyle = outer
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.lineTo(x3, y3)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = inner
  ctx.beginPath()
  ctx.moveTo((x1 + x2) / 2, (y1 + y2) / 2 + 6)
  ctx.lineTo(x2, y2 + 18)
  ctx.lineTo((x2 + x3) / 2, (y2 + y3) / 2 + 6)
  ctx.closePath()
  ctx.fill()
}

function drawFloppyEar(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.beginPath()
  ctx.ellipse(0, 26, 25, 55, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawRabbitEar(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, color: string): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(0, -34, 24, 66, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e9a39d'
  ctx.beginPath()
  ctx.ellipse(0, -35, 10, 45, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawRoundEar(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, 25, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e5a09a'
  ctx.beginPath()
  ctx.arc(x, y, 13, 0, Math.PI * 2)
  ctx.fill()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rectWidth: number,
  rectHeight: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, Math.abs(rectWidth) / 2, Math.abs(rectHeight) / 2)
  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.arcTo(x + rectWidth, y, x + rectWidth, y + rectHeight, safeRadius)
  ctx.arcTo(x + rectWidth, y + rectHeight, x, y + rectHeight, safeRadius)
  ctx.arcTo(x, y + rectHeight, x, y, safeRadius)
  ctx.arcTo(x, y, x + rectWidth, y, safeRadius)
  ctx.closePath()
}

function lighten(hex: string, amount: number): string {
  const value = hex.replace('#', '')
  const red = Math.min(255, Number.parseInt(value.slice(0, 2), 16) + amount)
  const green = Math.min(255, Number.parseInt(value.slice(2, 4), 16) + amount)
  const blue = Math.min(255, Number.parseInt(value.slice(4, 6), 16) + amount)

  return `rgb(${red} ${green} ${blue})`
}
</script>

<template>
  <canvas
    ref="canvas"
    class="pet-canvas"
    role="img"
    :aria-label="label"
  />
</template>

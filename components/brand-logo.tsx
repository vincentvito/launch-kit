import Image from 'next/image'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  priority?: boolean
  sizes?: string
}

export function BrandLogo({
  className,
  priority = false,
  sizes = '(max-width: 768px) 150px, 190px',
}: BrandLogoProps) {
  return (
    <Image
      src="/shipdaddy-logo.png"
      alt="shipdaddy"
      width={2400}
      height={868}
      priority={priority}
      sizes={sizes}
      className={cn('h-12 w-auto object-contain', className)}
    />
  )
}

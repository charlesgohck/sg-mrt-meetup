'use client'

import dynamic from 'next/dynamic'

const MrtFinder = dynamic(() => import('./MrtFinder'), { ssr: false })

export default function MrtFinderDynamic() {
  return <MrtFinder />
}

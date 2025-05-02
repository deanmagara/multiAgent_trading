import { MeshProps } from '@react-three/fiber'
import * as THREE from 'three'

export function VolumeBar({
  position,
  size,
  color
}: {
  position: [number, number, number]
  size: [number, number, number]
  color: THREE.Color
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}
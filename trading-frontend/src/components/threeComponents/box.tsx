import { MeshProps } from '@react-three/fiber'
import * as THREE from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: MeshProps
      boxGeometry: THREE.BoxGeometry
      meshStandardMaterial: THREE.MeshStandardMaterial
    }
  }
}

export function Box(props: MeshProps & { color: string }) {
  return (
    <mesh {...props}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  )
}
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Box } from './threeComponents/box' // Create this component

export function ThreeScene() {
  return (
    <Canvas>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Box position={[-1.2, 0, 0]} color="orange" />
      <Box position={[1.2, 0, 0]} color="hotpink" />
    </Canvas>
  )
}
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Box } from '@react-three/drei'

export function threeScene() {
  return (
    <Canvas>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Box position={[-1.2, 0, 0]}>
        <meshStandardMaterial color="orange" />
      </Box>
      <Box position={[1.2, 0, 0]}>
        <meshStandardMaterial color="hotpink" />
      </Box>
    </Canvas>
  )
}
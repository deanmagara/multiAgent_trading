import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { VolumeBar } from './threeComponents/volumeBar' // Create this component

export function VolumeVisualization({ data }: { data: { date: string; volume: number }[] }) {
  const maxVolume = Math.max(...data.map(d => d.volume))
  
  return (
    <Canvas camera={{ position: [0, 10, 15], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enablePan={false} />
      
      {data.map((item, i) => (
        <VolumeBar
          key={item.date}
          position={[i - data.length / 2, 0, 0]}
          size={[0.8, item.volume / maxVolume * 10, 0.8]}
          color={new THREE.Color(
            0.5 + (item.volume / maxVolume) * 0.5,
            0.2,
            0.5 - (item.volume / maxVolume) * 0.5
          )}
        />
      ))}
    </Canvas>
  )
}
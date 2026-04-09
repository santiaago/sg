import { useState, useRef } from 'react'
import type { JSX } from 'react'
import { useGeometryStore, useGeometryStorev2, useGeometryStorev3, useGeometryStorev4 } from './react-store'
import { SixFold } from './components/SixFold'
import { SixFoldv2 } from './components/SixFoldv2'
import { SixFoldv3 } from './components/SixFoldv3'
import { SixFoldv4 } from './components/SixFoldv4'
import { Square } from './components/Square'
import { GeometryList } from './components/GeometryList'
import { Navigation } from './components/Navigation'

export default function App(): JSX.Element {
  const stroke = 0.5
  const strokeMid = 0.5
  const strokeBig = 2
  const strokeLine = 1.4
  
  // Navigation menu state
  const [activeSection, setActiveSection] = useState<string>('sixfold-v4')
  const sectionRefs = {
    'sixfold-v4': useRef<HTMLDivElement>(null),
    'sixfold-v3': useRef<HTMLDivElement>(null),
    'sixfold-v2': useRef<HTMLDivElement>(null),
    'sixfold-v1': useRef<HTMLDivElement>(null),
    'square': useRef<HTMLDivElement>(null)
  }
  
  // Scroll to section when navigation changes
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const timeoutId = setTimeout(() => {
      sectionRefs[sectionId].current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      clearTimeout(timeoutId)
    }, 100)
  }

  const store = useGeometryStore()
  const storev2 = useGeometryStorev2()
  const storev3 = useGeometryStorev3()
  const storev4 = useGeometryStorev4()

  const [stepsv3, setStepsv3] = useState<any[]>([])
  const [currentStepv3, setCurrentStepv3] = useState<number>(0)
  
  const handleNextClickv3 = (): void => {
    console.log("next step", currentStepv3, stepsv3.length)
    if (currentStepv3 < stepsv3.length) {
      console.log("inside")
      const step = stepsv3[currentStepv3]
      console.log(step)
      step.draw = true
      step.drawShapes()
      console.log("after drawShapes")
      setCurrentStepv3(currentStepv3 + 1)
    }
  }

  const updateStepsv3 = (newSteps: any[]): void => {
    console.log("newSteps", newSteps, "stepsv3", stepsv3)
    setStepsv3(newSteps)
  }

  const [stepsv4, setStepsv4] = useState<any[]>([])
  const [currentStepv4, setCurrentStepv4] = useState<number>(0)
  
  const handleNextClickv4 = (): void => {
    console.log("next step", currentStepv4, stepsv4.length)
    if (currentStepv4 < stepsv4.length) {
      console.log("inside")
      const step = stepsv4[currentStepv4]
      console.log(step)
      step.draw = true
      step.drawShapes()
      console.log("after drawShapes")
      setCurrentStepv4(currentStepv4 + 1)
    }
  }

  const updateStepsv4 = (newSteps: any[]): void => {
    console.log("newSteps", newSteps, "stepsv4", stepsv4)
    setStepsv4(newSteps)
  }

  return (
    <main className="p-8 bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-8 text-left text-blue-400">sg</h1>
      
      <Navigation 
        onNavigate={scrollToSection} 
        activeSection={activeSection}
      />
      
      {/* v4 Section */}
      <div ref={sectionRefs['sixfold-v4']} className="mb-8 p-8 bg-dark-card rounded-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1 text-left">1/4 Six fold pattern v4</h1>
          <small className="block text-gray-400 mb-2">14/05/2023</small>
          <p className="text-gray-300 mb-4">1/4 Six fold pattern, with input output geometries</p>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-9">
            <SixFoldv4
              store={storev4}
              stroke={stroke}
              strokeMid={strokeMid}
              strokeBig={strokeBig}
              strokeLine={strokeLine}
              steps={stepsv4}
              updateSteps={updateStepsv4}
            />
            <div className="mt-4">
              <button onClick={handleNextClickv4} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">next</button>
            </div>
          </div>
          <div className="col-span-3 pl-4">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">Current step {currentStepv4}/{stepsv4.length}</p>
            <div>
              <GeometryList
                store={storev4}
                stroke={stroke}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
              />
            </div>
          </div>
        </div>
      </div>

      {/* v3 Section */}
      <div ref={sectionRefs['sixfold-v3']} className="mb-8 p-8 bg-gray-900 rounded-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1 text-left">1/4 Six fold pattern v3</h1>
          <small className="block text-gray-400 mb-2">11/03/2023</small>
          <p className="text-gray-300 mb-4">1/4 Six fold pattern, with steps to display geometry incrementally</p>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-9">
            <SixFoldv3
              store={storev3}
              stroke={stroke}
              strokeMid={strokeMid}
              strokeBig={strokeBig}
              strokeLine={strokeLine}
              steps={stepsv3}
              updateSteps={updateStepsv3}
            />
            <div className="mt-4">
              <button onClick={handleNextClickv3} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">next</button>
            </div>
          </div>
          <div className="col-span-3 pl-4">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">Current step {currentStepv3}/{stepsv3.length}</p>
            <div>
              <GeometryList
                store={storev3}
                stroke={stroke}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
              />
            </div>
          </div>
        </div>
      </div>

      {/* v2 Section */}
      <div ref={sectionRefs['sixfold-v2']} className="mb-8 p-8 bg-gray-900 rounded-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1 text-left">1/4 Six fold pattern v2</h1>
          <small className="block text-gray-400 mb-2">24/12/2022</small>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-9">
            <SixFoldv2
              store={storev2}
              stroke={stroke}
              strokeMid={strokeMid}
              strokeBig={strokeBig}
              strokeLine={strokeLine}
            />
          </div>
          <div className="col-span-3 pl-4">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <div>
              <GeometryList
                store={storev2}
                stroke={stroke}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
              />
            </div>
          </div>
        </div>
      </div>

      {/* v1 Section */}
      <div ref={sectionRefs['sixfold-v1']} className="mb-8 p-8 bg-gray-900 rounded-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1 text-left">1/4 Six fold pattern</h1>
          <small className="block text-gray-400 mb-2">08/10/2022</small>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-9">
            <SixFold
              store={store}
              stroke={stroke}
              strokeMid={strokeMid}
              strokeBig={strokeBig}
              strokeLine={strokeLine}
            />
          </div>
          <div className="col-span-3 pl-4">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <div>
              <GeometryList
                store={store}
                stroke={stroke}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Square Section */}
      <div ref={sectionRefs['square']} className="p-8 bg-gray-900 rounded-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1 text-left">Drawing a square</h1>
          <small className="block text-gray-400 mb-2">08/10/2022</small>
          <a href="https://www.youtube.com/watch?v=RSP5sm1e--4" target="_blank" className="text-blue-500 hover:underline text-sm">inspired by</a>
        </div>
        <div className="col-span-9">
          <Square />
        </div>
      </div>
    </main>
  )
}
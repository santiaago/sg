import { useState } from 'react'
import { useGeometryStore, useGeometryStorev2, useGeometryStorev3, useGeometryStorev4 } from './react-store'
import { SixFold } from './components/SixFold'
import { SixFoldv2 } from './components/SixFoldv2'
import { SixFoldv3 } from './components/SixFoldv3'
import { SixFoldv4 } from './components/SixFoldv4'
import { Square } from './components/Square'
import { GeometryList } from './components/GeometryList'
import './App.css'

export default function App() {
  const stroke = 0.5
  const strokeMid = 0.5
  const strokeBig = 2
  const strokeLine = 1.4

  const store = useGeometryStore()
  const storev2 = useGeometryStorev2()
  const storev3 = useGeometryStorev3()
  const storev4 = useGeometryStorev4()

  const [stepsv3, setStepsv3] = useState([])
  const [currentStepv3, setCurrentStepv3] = useState(0)
  
  const handleNextClickv3 = () => {
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

  const updateStepsv3 = (newSteps) => {
    console.log("newSteps", newSteps, "stepsv3", stepsv3)
    setStepsv3(newSteps)
  }

  const [stepsv4, setStepsv4] = useState([])
  const [currentStepv4, setCurrentStepv4] = useState(0)
  
  const handleNextClickv4 = () => {
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

  const updateStepsv4 = (newSteps) => {
    console.log("newSteps", newSteps, "stepsv4", stepsv4)
    setStepsv4(newSteps)
  }

  return (
    <main>
      <h1>sg</h1>
      
      {/* v4 Section */}
      <div className="row">
        <div className="title">
          <h1>1/4 Six fold pattern v4</h1>
          <small>14/05/2023</small>
          <p>1/4 Six fold pattern, with input output geometries</p>
        </div>
        <div className="left">
          <SixFoldv4
            store={storev4}
            stroke={stroke}
            strokeMid={strokeMid}
            strokeBig={strokeBig}
            strokeLine={strokeLine}
            steps={stepsv4}
            updateSteps={updateStepsv4}
          />
          <div>
            <button onClick={handleNextClickv4}>next</button>
          </div>
        </div>
        <div className="right">
          <h2>Right pane</h2>
          <p>Current step {currentStepv4}/{stepsv4.length}</p>
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

      {/* v3 Section */}
      <div className="row">
        <div className="title">
          <h1>1/4 Six fold pattern v3</h1>
          <small>11/03/2023</small>
          <p>1/4 Six fold pattern, with steps to display geometry incrementally</p>
        </div>
        <div className="left">
          <SixFoldv3
            store={storev3}
            stroke={stroke}
            strokeMid={strokeMid}
            strokeBig={strokeBig}
            strokeLine={strokeLine}
            steps={stepsv3}
            updateSteps={updateStepsv3}
          />
          <div>
            <button onClick={handleNextClickv3}>next</button>
          </div>
        </div>
        <div className="right">
          <h2>Right pane</h2>
          <p>Current step {currentStepv3}/{stepsv3.length}</p>
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

      {/* v2 Section */}
      <div className="row">
        <div className="title">
          <h1>1/4 Six fold pattern v2</h1>
          <small>24/12/2022</small>
        </div>
        <div className="left">
          <SixFoldv2
            store={storev2}
            stroke={stroke}
            strokeMid={strokeMid}
            strokeBig={strokeBig}
            strokeLine={strokeLine}
          />
        </div>
        <div className="right">
          <h2>Right pane</h2>
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

      {/* v1 Section */}
      <div className="row">
        <div className="title">
          <h1>1/4 Six fold pattern</h1>
          <small>08/10/2022</small>
        </div>
        <div className="left">
          <SixFold
            store={store}
            stroke={stroke}
            strokeMid={strokeMid}
            strokeBig={strokeBig}
            strokeLine={strokeLine}
          />
        </div>
        <div className="right">
          <h2>Right pane</h2>
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

      {/* Square Section */}
      <div className="row">
        <div className="title">
          <h1>Drawing a square</h1>
        </div>
        <div className="left">
          <Square />
        </div>
      </div>
    </main>
  )
}
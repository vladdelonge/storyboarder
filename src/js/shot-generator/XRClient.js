const THREE = require('three')
window.THREE = window.THREE || THREE
const RoundedBoxGeometry = require('three-rounded-box')(THREE)
const TWEEN = require('@tweenjs/tween.js');
window.TWEEN = TWEEN

const path = require('path')
const React = require('react')
const { useRef, useEffect, useState } = React

const { dialog } = require('electron').remote
const fs = require('fs')
const ModelLoader = require('../services/model-loader')

const applyDeviceQuaternion = require('./apply-device-quaternion')
const IconSprites = require('./IconSprites')

const boxRadius = .005
const boxRadiusSegments = 5

// return a group which can report intersections
const groupFactory = () => {
  let group = new THREE.Group()
  group.raycast = function ( raycaster, intersects ) {
    let results = raycaster.intersectObjects(this.children)
    if (results.length) {
      // distance – distance between the origin of the ray and the intersection
      // point – point of intersection, in world coordinates
      // face – intersected face
      // faceIndex – index of the intersected face
      // object – the intersected object
      // uv - U,V coordinates at point of intersection
      intersects.push({ object: this })
    }
  }
  return group
}

const materialFactory = () => new THREE.MeshToonMaterial({
  color: 0xcccccc,
  emissive: 0x0,
  specular: 0x0,
  shininess: 0,
  flatShading: false
})

const XRClient = React.memo(({ scene, id, type, isSelected, loaded, updateObject, remoteInput, camera, ...props }) => {
  const setLoaded = loaded => updateObject(id, { loaded })

  const container = useRef()
  
  //.easing(TWEEN.Easing.Quadratic.Out) // Use an easing function to make the animation smooth.
  let tween = new TWEEN.Tween({})
  
  // This doesn't work with tween@18.3.1
  const setTweenData = () => {
    console.clear()
    tween.stop()
  
    tween = new TWEEN.Tween({
      x: container.current.position.x,
      y: container.current.position.y,
      z: container.current.position.z,
      rotx: container.current.rotation.x,
      roty: container.current.rotation.y,
      rotz: container.current.rotation.z
    })
    
    tween.to({
      x: props.x,
      y: props.y,
      z: props.z,
      rotx: props.rotation.x,
      roty: props.rotation.y,
      rotz: props.rotation.z
    }, 200)
    
    tween.onUpdate(({ x, y, z, rotx, roty, rotz }) => {
      container.current.position.x = x
      container.current.position.y = y
      container.current.position.z = z
      container.current.rotation.x = rotx
      container.current.rotation.y = roty
      container.current.rotation.z = rotz
    })
    
    tween.start()
  }
  
  const setTweenDataWorks = () => {
    console.clear()
    TWEEN.removeAll()
    
    let tween = new TWEEN.Tween({
      x: container.current.position.x,
      y: container.current.position.y,
      z: container.current.position.z,
      rotx: container.current.rotation.x,
      roty: container.current.rotation.y,
      rotz: container.current.rotation.z
    })
    
    tween.to({
      x: props.x || 0,
      y: props.y || 0,
      z: props.z || 0,
      rotx: props.rotation.x || 0,
      roty: props.rotation.y || 0,
      rotz: props.rotation.z || 0
    }, 200)
    
    tween.onUpdate(({ x, y, z, rotx, roty, rotz }) => {
      //{ x, y, z, rotx, roty, rotz }
      /*
      state.
state.
state.
state.
state.
state.
       */
      //console.clear()
      //console.log('TWEEN UPDATE', x, y, z)
      container.current.position.x = x
      container.current.position.y = y
      container.current.position.z = z
      container.current.rotation.x = rotx
      container.current.rotation.y = roty
      container.current.rotation.z = rotz
    })
    
    tween.start()
    
    console.log('New props', props, tween)
  }

  useEffect(() => {
    console.log(type, id, 'added')
    

    container.current = groupFactory()
    container.current.userData.id = id
    container.current.userData.type = type
  
    console.log(container.current, 'CLIENT')

    //container.current.orthoIcon = new IconSprites( type, "", container.current )
    //scene.add(container.current.orthoIcon)

    console.log(type, id, 'XR CLIENT added to scene')
    scene.add(container.current)
  
    let geometry = new RoundedBoxGeometry( 0.5, 0.5, 0.5, boxRadius, boxRadiusSegments )
    let material = materialFactory()
    let mesh = new THREE.Mesh( geometry, material )
    mesh.renderOrder = 1.0
    mesh.layers.disable(0)
    mesh.layers.enable(1)
    mesh.layers.enable(2)
    mesh.layers.enable(3)
    container.current.remove(...container.current.children)
    container.current.add(mesh)
    setLoaded(true)

    return function cleanup () {
      console.log(type, id, 'XR CLIENT removed from scene')
      scene.remove(container.current.orthoIcon)
      scene.remove(container.current)
    }
  }, [])
  
  useEffect(() => {
    setTweenData()
    //container.current.orthoIcon.position.copy(container.current.position)
  }, [
    props.x,
    props.y,
    props.z
  ])

  useEffect(() => {
    setTweenData()
    //container.current.orthoIcon.icon.rotation = props.rotation.y
  }, [
    props.rotation.x,
    props.rotation.y,
    props.rotation.z
  ])

  useEffect(() => {
    container.current.visible = props.visible
  }, [
    props.visible
  ])
  
  useEffect(() => {
    if (!container.current.children[0]) return
    if (!container.current.children[0].material) return
    
    container.current.children[0].material.userData.outlineParameters = {
      thickness: 0.008,
      color: [ 0, 0, 0 ]
    }
  }, [isSelected])

  return null
})

module.exports = XRClient
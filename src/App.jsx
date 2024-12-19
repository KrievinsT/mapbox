import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'

import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css'

const INITIAL_CENTER = [
  -74.0242,
  40.6941
]
const INITIAL_ZOOM = 10.12

function App() {
  const mapRef = useRef()
  const mapContainerRef = useRef()
  const [citySearch, setCitySearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [center, setCenter] = useState(INITIAL_CENTER)
  const [zoom, setZoom] = useState(INITIAL_ZOOM)

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHJ1YmxlIiwiYSI6ImNtNHYwdmh6MzAwaTEybXBkOW54dXh6aXYifQ._L9N4G-Ewt_bobjTuToiCg'
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: center,
      zoom: zoom
    });

    mapRef.current.on('move', () => {
      const mapCenter = mapRef.current.getCenter()
      const mapZoom = mapRef.current.getZoom()

      setCenter([mapCenter.lng, mapCenter.lat])
      setZoom(mapZoom)
    })

    return () => {
      mapRef.current.remove()
    }
  }, [])

  const handleButtonClick = () => {
    mapRef.current.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM
    })
  }

  const handleCitySearch = async (e) => {
    e.preventDefault()
    if (!citySearch.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          citySearch
        )}.json?access_token=${mapboxgl.accessToken}&types=place`
      )

      if (!response.ok) throw new Error('Failed to fetch location')

      const data = await response.json()

      if (data.features.length === 0) {
        setError('City not found')
        return
      }

      const [longitude, latitude] = data.features[0].center

      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 10,
        essential: true
      })

      setCitySearch('')
    } catch (err) {
      setError('Error searching for city')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="sidebar">
        Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)} | Zoom: {zoom.toFixed(2)}
      </div>
      <div className="search-container">
        <form onSubmit={handleCitySearch}>
          <input
            type="text"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            placeholder="Enter city name"
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>
      <button className='reset-button' onClick={handleButtonClick}>
        Reset
      </button>
      <div id='map-container' ref={mapContainerRef} />
    </>
  )
}

export default App
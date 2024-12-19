import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'

import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css'

const INITIAL_CENTER = [
  -74.0242,
  40.6941
]
const INITIAL_ZOOM = 10.12

const SEARCH_TYPES = {
  CITY: 'city',
  COUNTRY: 'country'
}

function App() {
  const mapRef = useRef()
  const mapContainerRef = useRef()
  const [searchText, setSearchText] = useState('')
  const [searchType, setSearchType] = useState(SEARCH_TYPES.CITY)
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

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchText.trim()) return

    setLoading(true)
    setError('')

    try {
      // Set different zoom levels and types based on search type
      const types = searchType === SEARCH_TYPES.CITY ? 'place' : 'country'
      const defaultZoom = searchType === SEARCH_TYPES.CITY ? 10 : 4

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchText
        )}.json?access_token=${mapboxgl.accessToken}&types=${types}`
      )

      if (!response.ok) throw new Error('Failed to fetch location')

      const data = await response.json()

      if (data.features.length === 0) {
        setError(`${searchType === SEARCH_TYPES.CITY ? 'City' : 'Country'} not found`)
        return
      }

      const [longitude, latitude] = data.features[0].center
      const bounds = data.features[0].bbox

      if (bounds && searchType === SEARCH_TYPES.COUNTRY) {
        // If bbox is available, use it to fit the map to the country's bounds
        mapRef.current.fitBounds([
          [bounds[0], bounds[1]], // southwestern corner
          [bounds[2], bounds[3]]  // northeastern corner
        ], {
          padding: 50
        })
      } else {
        // If no bbox or searching for a city, just fly to the center point
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: defaultZoom,
          essential: true
        })
      }

      setSearchText('')
    } catch (err) {
      setError('Error performing search')
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
        <form onSubmit={handleSearch}>
          <select 
            value={searchType} 
            onChange={(e) => setSearchType(e.target.value)}
            className="search-type-select"
          >
            <option value={SEARCH_TYPES.CITY}>City</option>
            <option value={SEARCH_TYPES.COUNTRY}>Country</option>
          </select>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={`Enter ${searchType} name`}
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
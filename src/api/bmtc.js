const BASE = '/bmtc'

async function postJson(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      lan: 'en',
      deviceType: 'WEB',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`BMTC API ${path} failed: ${res.status} ${res.statusText} ${text}`)
  }

  const text = await res.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return {}
  }

  if (typeof parsed === 'string') {
    try {
      return JSON.parse(parsed)
    } catch {
      return {}
    }
  }

  return parsed
}

async function fetchRouteDetails(routeParentId) {
  const rid = Number(routeParentId)
  if (!(rid > 0)) return null

  return postJson('/SearchByRouteDetails_v4', {
    routeid: rid,
    servicetypeid: 0,
  })
}

async function fetchRoutePoints(routeId) {
  const id = Number(routeId)
  if (!(id > 0)) return []

  const json = await postJson('/RoutePoints', { routeid: id })
  const data = Array.isArray(json?.data) ? json.data : []
  const points = []
  for (const obj of data) {
    const lat = Number(obj?.latitude)
    const lng = Number(obj?.longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue
    points.push({ lat, lng })
  }
  return points
}

export async function searchRoutes(query) {
  const trimmed = String(query ?? '').trim()
  if (!trimmed) return []

  const json = await postJson('/SearchRoute_v2', { routetext: trimmed })
  const data = Array.isArray(json?.data) ? json.data : []

  const out = []
  for (const item of data) {
    const routeNo = String(item?.routeno ?? '').trim()
    const parentId = Number(item?.routeparentid ?? -1)
    if (!routeNo || !(parentId > 0)) continue
    out.push({ routeNo, routeParentId: parentId })
  }

  const seen = new Set()
  return out.filter((r) => {
    if (seen.has(r.routeNo)) return false
    seen.add(r.routeNo)
    return true
  })
}

export async function fetchRouteStops(routeNo, routeParentId) {
  const rn = String(routeNo ?? '').trim()
  const rid = Number(routeParentId)
  if (!rn || !(rid > 0)) return []

  const json = await fetchRouteDetails(rid)
  if (!json) return []

  const parseStops = (direction, arr) => {
    if (!Array.isArray(arr)) return []
    const stops = []
    for (let i = 0; i < arr.length; i += 1) {
      const stopObj = arr[i]
      const name = String(stopObj?.stationname ?? '').trim()
      const lat = Number(stopObj?.centerlat)
      const lng = Number(stopObj?.centerlong)
      if (!name || Number.isNaN(lat) || Number.isNaN(lng)) continue
      stops.push({
        id: `bmtc:${rn}:${direction}:${i + 1}:${name}`,
        name,
        direction,
        location: { lat, lng },
      })
    }
    return stops
  }

  const upStops = json?.up?.data
  const downStops = json?.down?.data

  return [...parseStops(0, upStops), ...parseStops(1, downStops)]
}

export async function fetchRoutePolylines(routeNo, routeParentId) {
  const rn = String(routeNo ?? '').trim()
  const rid = Number(routeParentId)
  if (!rn || !(rid > 0)) return []

  const json = await fetchRouteDetails(rid)
  if (!json) return []

  const upStops = Array.isArray(json?.up?.data) ? json.up.data : []
  const downStops = Array.isArray(json?.down?.data) ? json.down.data : []

  const polylines = []

  const upRouteId = Number(upStops?.[0]?.routeid ?? -1)
  if (upRouteId > 0) {
    const points = await fetchRoutePoints(upRouteId)
    if (points.length >= 2) polylines.push({ direction: 0, points })
  }

  const downRouteId = Number(downStops?.[0]?.routeid ?? -1)
  if (downRouteId > 0) {
    const points = await fetchRoutePoints(downRouteId)
    if (points.length >= 2) polylines.push({ direction: 1, points })
  }

  return polylines
}

export async function fetchLiveVehicles(routeNo, routeParentId) {
  const rn = String(routeNo ?? '').trim()
  const rid = Number(routeParentId)
  if (!rn || !(rid > 0)) return []

  const json = await fetchRouteDetails(rid)
  if (!json) return []

  const parseVehicles = (direction, arr) => {
    if (!Array.isArray(arr)) return []
    const out = []
    for (const obj of arr) {
      const vehicleId = Number(obj?.vehicleid)
      const vehicleNumber = String(obj?.vehiclenumber ?? '').trim() || null
      const lat = Number(obj?.centerlat)
      const lng = Number(obj?.centerlong)
      const location =
        !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : null
      const eta = String(obj?.eta ?? '').trim() || null
      const lastRefreshOn = String(obj?.lastrefreshon ?? '').trim() || null

      out.push({
        direction,
        vehicleId: vehicleId || null,
        vehicleNumber,
        location,
        eta,
        lastRefreshOn,
      })
    }
    return out
  }

  const upMap = json?.up?.mapData
  const downMap = json?.down?.mapData

  return [...parseVehicles(0, upMap), ...parseVehicles(1, downMap)]
}

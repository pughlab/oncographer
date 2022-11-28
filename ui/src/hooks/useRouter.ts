import {useReducer} from 'react'
import {useNavigate, useLocation, matchPath} from 'react-router-dom'

export default function useRouter() {
    const navigate = useNavigate()
    const location = useLocation()

    const isActivePath = (p: string) => !!matchPath(p, location.pathname)
    const isActivePathElement = (p: string, idx: number) => {
        const pathname = location.pathname.split('/')
        return p==pathname[idx]
    }
    const isActiveSlug = (p: string) => {
        const pathname = location.pathname.split('/')
        return isActivePathElement(p, pathname.length-1)
    }

    return {navigate, location, isActivePath, isActiveSlug, isActivePathElement}
}
  
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchBar({ onSearch }) {
  const navigate = useNavigate()
  const [value, setValue] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const query = value.trim()
    if (onSearch) onSearch(query)
    else navigate(`/shop${query ? `?search=${encodeURIComponent(query)}` : ''}`)
  }

  return (
    <form className="header-search" role="search" onSubmit={submit}>
      <Search size={16} />
      <input
        aria-label="Search products"
        placeholder="Search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </form>
  )
}
import { COUNTRIES, COUNTRY_BY_CODE } from '../../data/countries'
import { Field, Select } from '../ui/Field'

interface LocationFieldsProps {   
  country: string
  city: string
  onChange: (country: string, city: string) => void
}

export function LocationFields({ country, city, onChange }: LocationFieldsProps) {
  const cities = COUNTRY_BY_CODE[country]?.cities ?? []
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Country">
        <Select value={country} onChange={(e) => onChange(e.target.value, COUNTRY_BY_CODE[e.target.value].cities[0].name)}>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} - {c.name}
            </option>  
          ))}
        </Select> 
      </Field>
      <Field label="City">
        <Select value={city} onChange={(e) => onChange(country, e.target.value)}>
          {cities.map((c) => (
            <option key={c.name}>{c.name}</option>
          ))}
        </Select>
      </Field>
    </div>
  )
}

/* Runs before every test file: adds the jest-dom matchers (toBeInTheDocument
   and friends) and unmounts anything React Testing Library rendered, so one
   test's DOM never leaks into the next. */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

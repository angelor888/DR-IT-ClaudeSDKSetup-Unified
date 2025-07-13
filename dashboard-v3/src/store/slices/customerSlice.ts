import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Customer } from '../../types';

interface CustomerState {
  list: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  filters: {
    status: string[];
    tags: string[];
  };
}

const initialState: CustomerState = {
  list: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,
  searchTerm: '',
  filters: {
    status: [],
    tags: [],
  },
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCustomers: (state, action: PayloadAction<Customer[]>) => {
      state.list = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.list.push(action.payload);
    },
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.list.findIndex(customer => customer.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    deleteCustomer: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(customer => customer.id !== action.payload);
    },
    setSelectedCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.selectedCustomer = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<CustomerState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  setSelectedCustomer,
  setSearchTerm,
  setFilters,
  setError,
  clearError,
} = customerSlice.actions;
export default customerSlice.reducer;
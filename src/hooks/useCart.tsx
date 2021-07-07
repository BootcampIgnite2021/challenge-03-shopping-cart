import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productCart = [...cart];

      const productExists = productCart.find(product => product.id === productId);

      const getStock = await api.get(`/stock/${productId}`);
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > getStock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } 

      if (productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }

        productCart.push(newProduct)
      }

      setCart(productCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(productCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productCart = [...cart];

      const productIndex = productCart.findIndex(product => product.id === productId)
    
      if (productIndex >= 0) {
        productCart.splice(productIndex, 1);
        setCart(productCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(productCart))
      } else {
        throw new Error('')
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const getStock = await api.get(`/stock/${productId}`);

      if (amount > getStock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productCart = [...cart];
      const productExists = productCart.find(product => product.id === productId)

      if (productExists) {
        productExists.amount = amount;
        setCart(productCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(productCart))
      } else {
        throw new Error('')
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

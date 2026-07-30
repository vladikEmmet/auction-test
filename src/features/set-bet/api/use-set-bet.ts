import { useMutation, useQueryClient } from '@tanstack/react-query';

import { auctionKeys } from '@/entities/auction';
import { betKeys, setBet } from '@/entities/bet';

/**
 * После успешной ставки инвалидируются все три группы запросов: список (там меняются
 * текущая цена и торговый статус), детальная карточка и история ставок.
 */
export function useSetBetMutation(auctionUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (price: number) => setBet(auctionUuid, { price }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: auctionKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: auctionKeys.detail(auctionUuid) }),
        queryClient.invalidateQueries({ queryKey: betKeys.lists() }),
      ]);
    },
  });
}

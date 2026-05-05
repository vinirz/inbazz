import { Injectable, Logger } from '@nestjs/common';

interface AwesomeApiResponse {
  USDBRL: {
    bid: string;
  };
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly AWESOME_API_URL =
    'https://economia.awesomeapi.com.br/json/last/USD-BRL';

  async getUsdToBrlRate(): Promise<number> {
    this.logger.log('[CURRENCY] Fetching USD-BRL exchange rate');

    const response = await fetch(this.AWESOME_API_URL);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch exchange rate: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as AwesomeApiResponse;
    const rate = parseFloat(data.USDBRL.bid);

    this.logger.log(`[CURRENCY] USD-BRL rate: ${rate}`);

    return rate;
  }

  convertUsdCentsToBrlCents(usdCents: number, usdToBrlRate: number): number {
    return Math.round(usdCents * usdToBrlRate);
  }
}

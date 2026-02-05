import { isPlatformServer } from "@angular/common";
import {
  inject,
  Injectable,
  makeStateKey,
  PLATFORM_ID,
  resource,
  TransferState,
} from "@angular/core";

type Keys = "GetPaths";

@Injectable({
  providedIn: "root",
})
export class ResourceBuilder {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);

  public createResourceLoader<T>(
    key: Keys,
    initialState: T,
    callback: () => Promise<T>,
  ) {
    const stateKey = makeStateKey<T>(key);

    return resource({
      loader: async () => {
        if (this.transferState.hasKey(stateKey)) {
          const cachedData = this.transferState.get(stateKey, initialState);
          this.transferState.remove(stateKey);
          return cachedData;
        }

        const data = await callback();

        if (isPlatformServer(this.platformId)) {
          this.transferState.set(stateKey, data);
        }

        return data;
      },
    });
  }
}

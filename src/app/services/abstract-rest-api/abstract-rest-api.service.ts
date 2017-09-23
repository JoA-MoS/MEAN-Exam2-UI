
import { RestApiServiceConfig } from './rest-api-service-config';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { HttpClient } from '@angular/common/http';



export abstract class AbstractRestApiService<T> {
  data$: Observable<T[]>;
  private dataBS: BehaviorSubject<T[]>;
  private dataStore: {
    data: T[]
  };


  constructor(protected http: HttpClient, protected config: RestApiServiceConfig) {
    this.dataStore = { data: [] };
    this.dataBS = <BehaviorSubject<T[]>>new BehaviorSubject([]);
    this.data$ = this.dataBS.asObservable();
  }

  getAll$(options = this.config.options): Observable<T[]> {
    return this.http.get<T[]>(this.config.url, options);
  }

  getById$(id, options = this.config.options): Observable<T> {
    return this.http.get<T>(`${this.config.url}/${id}`, options);
  }

  create$(obj: T, options = this.config.options): Observable<T> {
    return this.http.post<T>(this.config.url, obj, options);
  }

  update$(id, obj: T, options = this.config.options): Observable<T> {
    return this.http.put<T>(`${this.config.url}/${id}`, obj, options);
  }

  delete$(id, options = this.config.options): Observable<Object> {
    return this.http.delete(`${this.config.url}/${id}`, options);
  }

  // Implementing Begavior Subject.
  loadAll(options = this.config.options) {
    this.getAll$(options).subscribe(data => {
      this.dataStore.data = data;
      this.dataBS.next(Object.assign({}, this.dataStore).data);
    },
      error => console.log(error));
  }

  loadById(id, options = this.config.options) {
    this.getById$(id, options).subscribe(data => {
      let notFound = true;

      this.dataStore.data.forEach((item, index) => {
        if (item['_id'] === data['_id']) {
          this.dataStore.data[index] = data;
          notFound = false;
        }
      });

      if (notFound) {
        this.dataStore.data.push(data);
      }
      this.dataBS.next(Object.assign({}, this.dataStore).data);
    },
      error => console.log(error));
  }

  create(obj: T, cb: Function = null, options = this.config.options) {
    this.create$(obj, options).subscribe(data => {
      this.dataStore.data.push(data);
      this.dataBS.next(Object.assign({}, this.dataStore).data);
      cb(data);
    }, error => console.log('Could not create data.'));
  }


  update(id, obj: T, options = this.config.options) {
    this.update$(id, obj, options).subscribe(data => {
      // if 204 no content we should just update the datastore from the obj
      console.log(this.dataStore);
      const idx = this.dataStore.data.findIndex((elem) => {
        // for some reason evaluating the config results in undefined
        // console.log(elem[this.config.idProperty], id);
        return elem['_id'] === id;
      });
      if (idx !== -1) {
        console.log('found');
        this.dataStore.data[idx] = data;
      }
      this.dataBS.next(Object.assign({}, this.dataStore).data);
    }, error => console.log('Could not update data.'));
  }

  delete(id, options = this.config.options) {
    this.delete$(id, options).subscribe(response => {
      const idx = this.dataStore.data.findIndex((elem) => {
        return elem['_id'] === id;
      });
      if (idx !== -1) {
        this.dataStore.data.splice(idx, 1);
      }
      this.dataBS.next(Object.assign({}, this.dataStore).data);
    }, error => console.log('Could not delete data.'));
  }
}
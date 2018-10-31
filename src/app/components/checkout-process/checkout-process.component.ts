import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap, filter, startWith } from 'rxjs/operators';

import { GetNextOrderStates, GetOrderForCheckout, TransitionToAddingItems } from '../../../../codegen/generated-types';
import { DataService } from '../../providers/data.service';

import { GET_NEXT_ORDER_STATES, TRANSITION_TO_ADDING_ITEMS } from './checkout-process.graphql';

@Component({
    selector: 'vsf-checkout-process',
    templateUrl: './checkout-process.component.html',
    styleUrls: ['./checkout-process.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutProcessComponent implements OnInit {

    cart$: Observable<GetOrderForCheckout.ActiveOrder | null | undefined>;
    nextStates$: Observable<string[]>;
    activeStage$: Observable<number>;
    constructor(private dataService: DataService,
                private route: ActivatedRoute,
                private router: Router) { }

    ngOnInit() {
        this.cart$ = this.route.data.pipe(switchMap(data => data.activeOrder));
        this.nextStates$ = this.dataService.query<GetNextOrderStates.Query>(GET_NEXT_ORDER_STATES).pipe(
            map(data => data.nextOrderStates),
        );
        this.activeStage$ =  this.router.events.pipe(
            filter((event) => event instanceof NavigationEnd),
            startWith(true),
            map(() => {
                const firstChild = this.route.snapshot.firstChild;
                if (firstChild && firstChild.routeConfig) {
                    switch (firstChild.routeConfig.path) {
                        case '':
                            return 1;
                        case 'shipping':
                            return 2;
                        case 'payment':
                            return 3;
                        case 'complete':
                            return 4;
                    }
                }
                return 1;
            }),
        );
    }

    changeShippingAddress() {
        this.dataService.mutate<TransitionToAddingItems.Mutation>(TRANSITION_TO_ADDING_ITEMS).subscribe(() => {
            this.router.navigate(['./shipping'], { relativeTo: this.route });
        });
    }

}
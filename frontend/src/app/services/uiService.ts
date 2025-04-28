import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
    current_form: any;

    constructor(){}

    open_form(form: any):void {
        this.current_form = form
        form = document.querySelector(form)
        let noir:any = document.querySelector(".noir")
        noir.style.display = "initial"
        form.setAttribute("style", "scale: 1; top:50%; left:50%")
    }

    close_forms(){
        let noir:any = document.querySelector(".noir");
        let form:any = document.querySelector(this.current_form);
        noir.style.display = "none";
        form.setAttribute("style", "scale: 0.01; top: -80%");
    }

    open_tooltip(tooltip:any){
        let temp = tooltip;
        tooltip = document.querySelector(tooltip);
        tooltip.setAttribute("style", "right: 0%");
        this.close_forms();
    
        setTimeout(()=> { this.close_tooltip(temp)
        }, 3000)
      }
    
    close_tooltip(tooltip:any){
    tooltip = document.querySelector(tooltip)
    tooltip.setAttribute("style", "right: -30%")
    }
}
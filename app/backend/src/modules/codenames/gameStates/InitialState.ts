import AbstractState from "./AbstractState";
import HintState from "./HintState";
import debug from "../../../framework/util/debug";
import {Team} from "../Team";
import Room from "../../../framework/Room";
import {BoardElement, Category} from "../BoardElement";

export default class InitialState extends AbstractState {
    handleUserLeave(gameMembers: Team[], userid: string): void {
        gameMembers.forEach(team => team.removePlayer(userid))
    }

    getName(): string {
        return "start"
    }

    onStateChange(eventData: { [p: string]: any }, gameMembers: Team[], room: Room, board: BoardElement[]): AbstractState {
        if (eventData.action) {
            switch (eventData.action) {
                case "joinInvestigator":
                    this.joinInvestigator(eventData, gameMembers);
                    break;
                case "setSpymaster":
                    this.setSpymaster(eventData, gameMembers);
                    break;
                case "startGame":
                    if(this.isStartGameValid(eventData.senderId, room, gameMembers)){
                        // generate cards on board
                        this.setBoard(board)
                        return new HintState(0)
                    } else {
                        debug(2, `User ID ${eventData.senderId} send in invalid action: `
                            + eventData.action + "due to missing rights")
                    }
                    break;
                default:
                    debug(2,`User ID ${eventData.senderId} send in invalid action: `, eventData.action);
            }
        } else {
            debug(2,`User ID ${eventData.senderId} made illegal request, property action missing`);
        }
        return this;
    }

    private joinInvestigator(eventData: { [p: string]: any }, gameMembers: Team[]) {
        if(this.doesEventPropertyExist(eventData, "target")){
            let team = gameMembers.find(team => team.name === eventData.target)
            if(team){
                // leave all teams
                gameMembers.forEach(team => team.removePlayer(eventData.senderId))
                // join investigators
                team.addInvestigators(eventData.senderId)
            }else{
                this.debugIllegalPropertyValue(eventData.senderId, "target", eventData.target)
            }
        }
    }

    private setSpymaster(eventData: { [p: string]: any }, gameMembers: Team[]){
        if(this.doesEventPropertyExist(eventData, "target")){
            let team = gameMembers.find(team => team.name === eventData.target)
            if(team){
                // leave all teams
                gameMembers.forEach(team => team.removePlayer(eventData.senderId))
                // set spymaster
                gameMembers.find(team => team.name === eventData.target).setSpymaster(eventData.senderId)
            }else{
                this.debugIllegalPropertyValue(eventData.senderId, "target", eventData.target)
            }
        }
    }

    private isStartGameValid(senderId: string, room: Room, gameMembers: Team[]):Boolean{
        return senderId === room.getRoomMaster().getId()
            && gameMembers.find(
                team => team.spymaster === undefined || team.investigators === undefined
                    || team.investigators.length === 0
            ) === undefined
    }

    private setBoard(board: BoardElement[]){
        // TODO: add real data & shuffle teams cards
        board.push(new BoardElement("Apfel", Category.team, "A"))
        board.push(new BoardElement("Kokosnuss", Category.team, "A"))
        board.push(new BoardElement("Zauberstab", Category.team, "A"))
        board.push(new BoardElement("Technik", Category.team, "A"))
        board.push(new BoardElement("Pinguin", Category.team, "A"))

        board.push(new BoardElement("Ameise", Category.team, "B"))
        board.push(new BoardElement("Vogel", Category.team, "B"))
        board.push(new BoardElement("Christbaum", Category.team, "B"))
        board.push(new BoardElement("Leuchtstab", Category.team, "B"))
        board.push(new BoardElement("Feder", Category.team, "B"))

        board.push(new BoardElement("Pilz", Category.bomb, ""))

        board.push(new BoardElement("Floh", Category.neutral, ""))
        board.push(new BoardElement("Rot", Category.neutral, ""))
        board.push(new BoardElement("Lieblich", Category.neutral, ""))
        board.push(new BoardElement("Schnitzel", Category.neutral, ""))
        board.push(new BoardElement("Jaguar", Category.neutral, ""))
        board.push(new BoardElement("Schnecke", Category.neutral, ""))
        board.push(new BoardElement("Amerika", Category.neutral, ""))
        board.push(new BoardElement("Ozean", Category.neutral, ""))
        board.push(new BoardElement("Tempo", Category.neutral, ""))
        board.push(new BoardElement("Taste", Category.neutral, ""))
        board.push(new BoardElement("Herz", Category.neutral, ""))
        board.push(new BoardElement("Schale", Category.neutral, ""))
        board.push(new BoardElement("Rauch", Category.neutral, ""))
        board.push(new BoardElement("Nuss", Category.neutral, ""))
    }
}